/*
 * SPDX-FileCopyrightText: 2026 fukushu contributors
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Framing and relation checks adapted from tamaina/fukushu (MIT),
 * backupArchive.ts/backup.ts at 0efee271a13f15096beb8cbaaea25092c5927b29.
 * See ../FUKUSHU-LICENSE.txt. This inspector never invokes upstream restore.
 */
import { createHash } from 'node:crypto';
import * as v from 'valibot';
import { MAX_BACKUP_BYTES } from '../shared/backup.schema.js';
import { BackupError } from './backup-codec.js';
import { upstreamStoreSchemas } from './upstream-records.js';
import type { UpstreamRecords } from './upstream-records.js';
import type { UpstreamInspection } from '../shared/upstream-backup.schema.js';

export const UPSTREAM_MAGIC = 'FUKUSHU-BACKUP-1\n';
const stores = ['settings', 'decks', 'questions', 'studyStates', 'reviewLogs', 'importSources', 'media', 'imports'] as const;
const recordSchema = v.strictObject({ store: v.picklist(stores), value: v.record(v.string(), v.unknown()), blobSize: v.optional(v.pipe(v.number(), v.safeInteger(), v.minValue(0))) });
const checksum = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const check = (value: unknown) => { if (!value) throw new BackupError('INVALID_BACKUP'); };

/** Read-only, bounded subset of the pinned upstream binary format. No inferred history. */
export function inspectUpstreamBackup(bytes: Buffer): UpstreamInspection {
	if (bytes.length > MAX_BACKUP_BYTES) throw new BackupError('BACKUP_TOO_LARGE');
	check(bytes.length >= UPSTREAM_MAGIC.length + 64 && bytes.subarray(0, UPSTREAM_MAGIC.length).toString() === UPSTREAM_MAGIC);
	const end = bytes.length - 64;
	const digest = bytes.subarray(end).toString('utf8');
	check(/^[a-f0-9]{64}$/.test(digest) && checksum(bytes.subarray(0, end)) === digest);
	const records: UpstreamRecords = { settings: [], decks: [], questions: [], studyStates: [], reviewLogs: [], importSources: [], media: [], imports: [] };
	const blobs = new Map<string, Buffer>();
	const seen = new Set<string>();
	let offset = UPSTREAM_MAGIC.length;
	let total = 0;
	let binaryBytes = 0;
	while (offset < end) {
		if (++total > 20_000) throw new BackupError('UPSTREAM_INSPECTION_LIMIT');
		check(offset + 4 <= end);
		const length = bytes.readUInt32LE(offset); offset += 4;
		check(length > 0 && length <= 64 * 1024 * 1024 && length <= end - offset);
		let raw: unknown;
		try { raw = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(offset, offset + length))); } catch { throw new BackupError('INVALID_BACKUP'); }
		offset += length;
		const parsedRecord = v.safeParse(recordSchema, raw);
		if (!parsedRecord.success) throw new BackupError('INVALID_BACKUP');
		const record = parsedRecord.output;
		const parsedValue = v.safeParse(upstreamStoreSchemas[record.store], record.value);
		if (!parsedValue.success) throw new BackupError('INVALID_BACKUP');
		const key = record.value.id ?? record.value.questionId;
		check(typeof key === 'string' && !seen.has(`${record.store}:${key}`));
		seen.add(`${record.store}:${key}`);
		check(record.value.sourceArchiveBase64 === undefined && (record.store !== 'media' || record.value.blobBase64 === ''));
		if (record.blobSize !== undefined) {
			check((record.store === 'media' || record.store === 'importSources') && record.blobSize <= end - offset);
			if (record.store === 'media') blobs.set(String(key), bytes.subarray(offset, offset + record.blobSize));
			offset += record.blobSize; binaryBytes += record.blobSize;
		} else check(record.store !== 'media');
		(records[record.store] as unknown[]).push(parsedValue.output);
		const limit = record.store === 'settings' ? 1 : record.store === 'decks' ? 100 : record.store === 'questions' || record.store === 'studyStates' ? 1000 : 10_000;
		if (records[record.store].length > limit) throw new BackupError('UPSTREAM_INSPECTION_LIMIT');
	}
	check(offset === end && records.settings.length === 1);
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
	for (const row of records.media) {
		const blob = blobs.get(row.id);
		check(blob && blob.length === row.size && checksum(blob) === row.id);
	}
	for (const row of records.questions) {
		const question = row.payload;
		if (question.kind !== 'flashcard' || !question.ankiTemplateMode) continue;
		for (const match of (question.prompt.value + question.answer.value).matchAll(/fukushu-media:([a-f0-9]{64})/g)) check(blobs.has(match[1]));
	}
	const settings = records.settings.at(0);
	if (!settings) throw new BackupError('INVALID_BACKUP');
	return {
		format: 'FUKUSHU-BACKUP-1', imported: false, canImport: false, sha256: digest, exportedAt: null,
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
