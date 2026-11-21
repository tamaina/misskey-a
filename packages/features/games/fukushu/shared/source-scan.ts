/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { ReviewIdIndex } from './review-id-index.js';
import { MAX_BACKUP_BYTES } from './backup.schema.js';
import { checkMaterialCount, checkUpstreamRelations, decodeUpstreamRecord, emptyUpstreamRecords, summarizeUpstreamRecords, UPSTREAM_MAGIC, UpstreamBackupError } from './upstream-reader.js';
import type { UpstreamInspection } from './upstream-backup.schema.js';

// The browser and the server use the same archive and metadata limits.
export const MAX_SOURCE_ARCHIVE_BYTES = 1024 ** 3;
// Small files can retain the IDs directly. Larger files use offsets into the same immutable Blob.
const inlineIndexBytes = 64 * 1024 ** 2;
const chunkBytes = 256 * 1024;

class FileCursor {
	position = 0;
	private chunk: Uint8Array = new Uint8Array();
	private offset = 0;

	constructor(private readonly file: Blob, private readonly signal?: AbortSignal) {}

	async consume(size: number, visit: (bytes: Uint8Array) => void) {
		if (size > this.file.size - this.position) throw new UpstreamBackupError('INVALID_BACKUP');
		let remaining = size;
		while (remaining > 0) {
			this.signal?.throwIfAborted();
			if (this.offset === this.chunk.length) {
				const length = Math.min(chunkBytes, this.file.size - this.position);
				this.chunk = new Uint8Array(await this.file.slice(this.position, this.position + length).arrayBuffer());
				if (this.chunk.length !== length) throw new UpstreamBackupError('INVALID_BACKUP');
				this.offset = 0;
			}
			const count = Math.min(remaining, this.chunk.length - this.offset);
			visit(this.chunk.subarray(this.offset, this.offset + count));
			this.offset += count;
			this.position += count;
			remaining -= count;
		}
	}

	async read(size: number) {
		const bytes = new Uint8Array(size);
		let offset = 0;
		await this.consume(size, part => { bytes.set(part, offset); offset += part.length; });
		return bytes;
	}
}

export async function scanSourceArchive(file: Blob, signal?: AbortSignal) {
	if (file.size > MAX_SOURCE_ARCHIVE_BYTES) throw new UpstreamBackupError('BACKUP_TOO_LARGE');
	const cursor = new FileCursor(file, signal);
	const end = file.size - 64;
	const digest = sha256.create();
	const magic = await cursor.read(UPSTREAM_MAGIC.length);
	if (new TextDecoder().decode(magic) !== UPSTREAM_MAGIC) throw new UpstreamBackupError('INVALID_BACKUP');
	digest.update(magic);
	const records = emptyUpstreamRecords();
	const seen = new Set<string>();
	const media = new Set<string>();
	const reviewIds = file.size > inlineIndexBytes ? new ReviewIdIndex(file) : undefined;
	let referenceChars = 0;
	let materialBytes = 0;
	let materialCount = 0;
	let logCount = 0;
	const loggedQuestions = new Map<string, string>();
	const deckCounts = new Map<string, number>();
	const recent: UpstreamInspection['history'] = [];
	let binaryBytes = 0;
	while (cursor.position < end) {
		const prefix = await cursor.read(4);
		digest.update(prefix);
		const length = new DataView(prefix.buffer).getUint32(0, true);
		if (!length || length > end - cursor.position) throw new UpstreamBackupError('INVALID_BACKUP');
		if (length > MAX_BACKUP_BYTES) throw new UpstreamBackupError('UPSTREAM_INSPECTION_LIMIT');
		const json = await cursor.read(length);
		digest.update(json);
		const { store, value, blobSize } = decodeUpstreamRecord(json, seen, records, reviewIds !== undefined);
		if (store === 'reviewLogs') {
			const log = records.reviewLogs.pop();
			if (!log || (reviewIds && !await reviewIds.add(log.id, cursor.position - length - 4))) throw new UpstreamBackupError('INVALID_BACKUP');
			const previous = loggedQuestions.get(log.questionId);
			if (previous !== undefined && previous !== log.deckId) throw new UpstreamBackupError('INVALID_BACKUP');
			if (previous === undefined) {
				// Valid references must also fit in the material frames, even when logs precede questions.
				referenceChars += log.questionId.length + log.deckId.length;
				if (loggedQuestions.size >= 10_000 || referenceChars > MAX_BACKUP_BYTES) throw new UpstreamBackupError('INVALID_BACKUP');
				loggedQuestions.set(log.questionId, log.deckId);
			}
			deckCounts.set(log.deckId, (deckCounts.get(log.deckId) ?? 0) + 1);
			logCount++;
			const entry: UpstreamInspection['history'][number] = {
				id: log.id, deckId: log.deckId, questionId: log.questionId,
				reviewedAt: log.reviewedAt, rating: log.rating, correct: log.correct, questionSnapshot: 'unavailable',
				cardBefore: null, cardAfter: null, scheduler: null,
			};
			const index = recent.findIndex(other => Date.parse(entry.reviewedAt) > Date.parse(other.reviewedAt)
				|| (Date.parse(entry.reviewedAt) === Date.parse(other.reviewedAt) && entry.id.localeCompare(other.id) < 0));
			if (index !== -1) recent.splice(index, 0, entry);
			else if (recent.length < 20) recent.push(entry);
			if (recent.length > 20) recent.pop();
		} else {
			materialBytes += length;
			if (materialBytes > MAX_BACKUP_BYTES) throw new UpstreamBackupError('UPSTREAM_INSPECTION_LIMIT');
			checkMaterialCount(store, records, ++materialCount, 10_000);
		}
		if (blobSize === undefined) {
			if (store === 'media') throw new UpstreamBackupError('INVALID_BACKUP');
			continue;
		}
		if ((store !== 'media' && store !== 'importSources') || blobSize > end - cursor.position) throw new UpstreamBackupError('INVALID_BACKUP');
		if (store === 'media' && value.size !== blobSize) throw new UpstreamBackupError('INVALID_BACKUP');
		const mediaHash = store === 'media' ? sha256.create() : undefined;
		await cursor.consume(blobSize, part => { digest.update(part); mediaHash?.update(part); });
		if (mediaHash) {
			const id = bytesToHex(mediaHash.digest());
			if (value.id !== id) throw new UpstreamBackupError('INVALID_BACKUP');
			media.add(id);
		}
		binaryBytes += blobSize;
	}
	const hash = bytesToHex(digest.digest());
	if (cursor.position !== end || new TextDecoder('utf-8', { ignoreBOM: true }).decode(await cursor.read(64)) !== hash) throw new UpstreamBackupError('INVALID_BACKUP');
	signal?.throwIfAborted();
	checkUpstreamRelations(records, media);
	const questions = new Map(records.questions.map(question => [question.id, question.deckId]));
	for (const [id, deck] of loggedQuestions) {
		if (questions.get(id) !== deck) throw new UpstreamBackupError('INVALID_BACKUP');
	}
	const summary = summarizeUpstreamRecords(records, hash, binaryBytes);
	summary.counts.reviewLogs = logCount;
	for (const deck of summary.decks) deck.reviewLogs = deckCounts.get(deck.id) ?? 0;
	summary.history = recent;
	return summary;
}
