/*
 * SPDX-FileCopyrightText: 2026 fukushu contributors
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Framing and relation checks adapted from tamaina/fukushu (MIT),
 * backupArchive.ts/backup.ts at 0efee271a13f15096beb8cbaaea25092c5927b29.
 * See ../FUKUSHU-LICENSE.txt. This inspector never invokes upstream restore.
 */
import * as v from 'valibot';
import { MAX_BACKUP_BYTES } from './backup.schema.js';
import { upstreamStoreSchemas } from './upstream-records.schema.js';
import type { UpstreamRecords } from './upstream-records.schema.js';
import type { UpstreamInspection } from './upstream-backup.schema.js';

export const UPSTREAM_MAGIC = 'FUKUSHU-BACKUP-1\n';
const stores = ['settings', 'decks', 'questions', 'studyStates', 'reviewLogs', 'importSources', 'media', 'imports'] as const;
const recordSchema = v.strictObject({ store: v.picklist(stores), value: v.record(v.string(), v.unknown()), blobSize: v.optional(v.pipe(v.number(), v.safeInteger(), v.minValue(0))) });
export class UpstreamBackupError extends Error {
	constructor(public readonly code: 'INVALID_BACKUP' | 'BACKUP_TOO_LARGE' | 'UPSTREAM_INSPECTION_LIMIT') { super(code); }
}
const check = (value: unknown) => { if (!value) throw new UpstreamBackupError('INVALID_BACKUP'); };

export type UpstreamFrame = {
	store: keyof UpstreamRecords;
	/** Original JSON value, without schema defaults. */
	value: Record<string, unknown>;
	/** Absent and an explicitly empty binary are distinct. */
	blob?: Uint8Array;
};

export type UpstreamArchive = {
	readonly payloadSha256: string;
	readonly fileSha256: string;
	readonly binaryBytes: number;
	/** Each accessor returns an independent copy, never the retained snapshot. */
	originalBytes(): Uint8Array;
	frames(): UpstreamFrame[];
	/** Validation view only; defaults here must never be written into the original. */
	normalizedRecords(): UpstreamRecords;
};

export function emptyUpstreamRecords(): UpstreamRecords {
	return { settings: [], decks: [], questions: [], studyStates: [], reviewLogs: [], importSources: [], media: [], imports: [] };
}

/** Both readers apply the same schemas and retain the same normalized validation view. */
export function decodeUpstreamRecord(bytes: Uint8Array, seen: Set<string>, records: UpstreamRecords) {
	let raw: unknown;
	try { raw = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { throw new UpstreamBackupError('INVALID_BACKUP'); }
	const parsedRecord = v.safeParse(recordSchema, raw);
	if (!parsedRecord.success) throw new UpstreamBackupError('INVALID_BACKUP');
	const record = parsedRecord.output;
	const parsedValue = v.safeParse(upstreamStoreSchemas[record.store], record.value);
	if (!parsedValue.success) throw new UpstreamBackupError('INVALID_BACKUP');
	const key = record.value.id ?? record.value.questionId;
	check(typeof key === 'string' && !seen.has(`${record.store}:${key}`));
	seen.add(`${record.store}:${key}`);
	check(record.value.sourceArchiveBase64 === undefined && (record.store !== 'media' || record.value.blobBase64 === ''));
	(records[record.store] as unknown[]).push(parsedValue.output);
	return record;
}

/** Count material separately from append-only review history. All JSON still uses the byte budget. */
export function checkMaterialCount(store: keyof UpstreamRecords, records: UpstreamRecords, total: number, maxCards: number) {
	if (store === 'reviewLogs') return;
	const limit = store === 'settings' ? 1 : store === 'decks' ? 100 : store === 'questions' || store === 'studyStates' ? maxCards : 10_000;
	if (total - records.reviewLogs.length > 20_000 || records[store].length > limit) throw new UpstreamBackupError('UPSTREAM_INSPECTION_LIMIT');
}

export function checkUpstreamRelations(records: UpstreamRecords, mediaIds: { has(id: string): boolean }) {
	check(records.settings.length === 1);
	const deckIds = new Set(records.decks.map(row => row.id));
	const sourceIds = new Set(records.importSources.map(row => row.id));
	const questions = new Map(records.questions.map(row => [row.id, row]));
	const sourceKeys = new Map<string, Set<string>>();
	const orders = new Map<string, Set<number>>();
	for (const deck of records.decks) check(!deck.sourceId || sourceIds.has(deck.sourceId));
	for (const question of records.questions) {
		check(deckIds.has(question.deckId) && question.payload.id === question.id && question.payload.deckId === question.deckId && question.payload.kind === question.kind);
		const keys = sourceKeys.get(question.deckId) ?? new Set<string>();
		check(!keys.has(question.sourceKey)); keys.add(question.sourceKey); sourceKeys.set(question.deckId, keys);
		if (question.sourceOrder !== undefined) {
			const positions = orders.get(question.deckId) ?? new Set<number>();
			check(!positions.has(question.sourceOrder)); positions.add(question.sourceOrder); orders.set(question.deckId, positions);
		}
	}
	for (const row of [...records.studyStates, ...records.reviewLogs]) check(questions.has(row.questionId) && questions.get(row.questionId)?.deckId === row.deckId);
	for (const row of records.imports) check(deckIds.has(row.deckId));
	for (const row of records.questions) {
		const question = row.payload;
		if (question.kind !== 'flashcard' || !question.ankiTemplateMode) continue;
		for (const match of (question.prompt.value + question.answer.value).matchAll(/fukushu-media:([a-f0-9]{64})/g)) check(mediaIds.has(match[1]));
	}
}

/** Bounded, lossless snapshot. Validation never rewrites the original archive. */
export async function readUpstreamArchive(input: Uint8Array, sha256: (bytes: Uint8Array) => Promise<string>): Promise<UpstreamArchive> {
	if (input.length > MAX_BACKUP_BYTES) throw new UpstreamBackupError('BACKUP_TOO_LARGE');
	// Snapshot before the first await: caller mutation cannot race checksum/parsing.
	const bytes = new Uint8Array(input);
	check(bytes.length >= UPSTREAM_MAGIC.length + 64 && new TextDecoder().decode(bytes.subarray(0, UPSTREAM_MAGIC.length)) === UPSTREAM_MAGIC);
	const end = bytes.length - 64;
	const digest = new TextDecoder().decode(bytes.subarray(end));
	check(/^[a-f0-9]{64}$/.test(digest) && (await sha256(bytes.subarray(0, end))) === digest);
	const records = emptyUpstreamRecords();
	const blobs = new Map<string, Uint8Array>();
	const frames: UpstreamFrame[] = [];
	const seen = new Set<string>();
	let offset = UPSTREAM_MAGIC.length;
	let binaryBytes = 0;
	while (offset < end) {
		check(offset + 4 <= end);
		const length = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, true); offset += 4;
		check(length > 0 && length <= 64 * 1024 * 1024 && length <= end - offset);
		const record = decodeUpstreamRecord(bytes.subarray(offset, offset + length), seen, records);
		offset += length;
		const frame: UpstreamFrame = { store: record.store, value: record.value };
		if (record.blobSize !== undefined) {
			check((record.store === 'media' || record.store === 'importSources') && record.blobSize <= end - offset);
			frame.blob = bytes.subarray(offset, offset + record.blobSize);
			if (record.store === 'media') blobs.set(String(record.value.id), frame.blob);
			offset += record.blobSize; binaryBytes += record.blobSize;
		} else check(record.store !== 'media');
		frames.push(frame);
		checkMaterialCount(record.store, records, seen.size, 1000);
	}
	check(offset === end);
	checkUpstreamRelations(records, blobs);
	for (const row of records.media) {
		const blob = blobs.get(row.id);
		check(blob && blob.length === row.size && (await sha256(blob)) === row.id);
	}
	return Object.freeze({
		payloadSha256: digest, fileSha256: await sha256(bytes), binaryBytes,
		originalBytes: () => new Uint8Array(bytes),
		frames: () => structuredClone(frames),
		normalizedRecords: () => structuredClone(records),
	});
}

/** Public inspection remains a redacted projection, not an import authorization. */
export function projectUpstreamInspection(archive: UpstreamArchive): UpstreamInspection {
	return summarizeUpstreamRecords(archive.normalizedRecords(), archive.payloadSha256, archive.binaryBytes);
}

export function summarizeUpstreamRecords(records: UpstreamRecords, sha256: string, binaryBytes: number): UpstreamInspection {
	const settings = records.settings.at(0);
	if (!settings) throw new UpstreamBackupError('INVALID_BACKUP');
	return {
		format: 'FUKUSHU-BACKUP-1', imported: false, canImport: false, sha256, exportedAt: null,
		counts: Object.fromEntries(stores.filter(store => store !== 'settings').map(store => [store, records[store].length])) as UpstreamInspection['counts'],
		binaryBytes, currentDesiredRetention: settings.desiredRetention,
		missingQuestionOrders: records.questions.filter(row => row.sourceOrder === undefined).length,
		decks: records.decks.map(deck => ({ id: deck.id, name: deck.name, questions: records.questions.filter(row => row.deckId === deck.id).length, reviewLogs: records.reviewLogs.filter(row => row.deckId === deck.id).length })),
		history: [...records.reviewLogs].sort((a, b) => Date.parse(b.reviewedAt) - Date.parse(a.reviewedAt) || a.id.localeCompare(b.id)).slice(0, 20).map(row => ({
			id: row.id, deckId: row.deckId, questionId: row.questionId, reviewedAt: row.reviewedAt,
			rating: row.rating, correct: row.correct, questionSnapshot: 'unavailable', cardBefore: null, cardAfter: null, scheduler: null,
		})),
	};
}

/** Existing browser/server inspection entry point; response contract is unchanged. */
export async function inspectUpstreamBytes(bytes: Uint8Array, sha256: (bytes: Uint8Array) => Promise<string>): Promise<UpstreamInspection> {
	return projectUpstreamInspection(await readUpstreamArchive(bytes, sha256));
}
