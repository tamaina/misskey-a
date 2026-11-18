/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { MAX_BACKUP_BYTES } from '../shared/backup.schema.js';
import { checkUpstreamRelations, decodeUpstreamRecord, emptyUpstreamRecords, summarizeUpstreamRecords, UPSTREAM_MAGIC, UpstreamBackupError } from '../shared/upstream-reader.js';

// Bound user-initiated local work independently of the server's import budget.
// Only JSON counts toward the retained metadata budget. APKG/media stay opaque.
export const LOCAL_ARCHIVE_BYTES = 1024 ** 3;
const chunkBytes = 256 * 1024;

class FileCursor {
	position = 0;
	private chunk: Uint8Array = new Uint8Array();
	private offset = 0;

	constructor(private readonly file: File, private readonly signal?: AbortSignal) {}

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

/** Read-only local inspection. A report is returned only after the trailer and references pass. */
export async function inspectLocalUpstream(file: File, signal?: AbortSignal) {
	if (file.size > LOCAL_ARCHIVE_BYTES) throw new UpstreamBackupError('BACKUP_TOO_LARGE');
	if (!/\.fukushu$/i.test(file.name)) throw new UpstreamBackupError('INVALID_BACKUP');
	const cursor = new FileCursor(file, signal);
	const end = file.size - 64;
	const digest = sha256.create();
	const magic = await cursor.read(UPSTREAM_MAGIC.length);
	if (new TextDecoder().decode(magic) !== UPSTREAM_MAGIC) throw new UpstreamBackupError('INVALID_BACKUP');
	digest.update(magic);
	const records = emptyUpstreamRecords();
	const seen = new Set<string>();
	const media = new Set<string>();
	let metadataBytes = 0;
	let binaryBytes = 0;
	while (cursor.position < end) {
		if (seen.size >= 20_000) throw new UpstreamBackupError('UPSTREAM_INSPECTION_LIMIT');
		const prefix = await cursor.read(4);
		digest.update(prefix);
		const length = new DataView(prefix.buffer).getUint32(0, true);
		if (!length || length > end - cursor.position) throw new UpstreamBackupError('INVALID_BACKUP');
		metadataBytes += length;
		if (metadataBytes > MAX_BACKUP_BYTES) throw new UpstreamBackupError('UPSTREAM_INSPECTION_LIMIT');
		const json = await cursor.read(length);
		digest.update(json);
		const { store, value, blobSize } = decodeUpstreamRecord(json, seen, records);
		const limit = store === 'settings' ? 1 : store === 'decks' ? 100 : 10_000;
		if (records[store].length > limit) throw new UpstreamBackupError('UPSTREAM_INSPECTION_LIMIT');
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
	return summarizeUpstreamRecords(records, hash, binaryBytes);
}
