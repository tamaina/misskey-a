/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { expect, test } from 'vitest';
import { inspectUpstreamBackup, UPSTREAM_MAGIC } from '../../backend/upstream-backup.js';
import { MAX_BACKUP_BYTES } from '../../shared/backup.schema.js';
import { decodeBackup } from '../../backend/backup-codec.js';

const golden = readFileSync('../features/games/fukushu/test/backend/fixtures/upstream-backup.fukushu');
const provenance = JSON.parse(readFileSync('../features/games/fukushu/test/backend/fixtures/upstream-backup.provenance.json', 'utf8')) as { fixtureSha256: string };
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
type Frame = { meta: { store: string; value: Record<string, unknown>; blobSize?: number }; blob: Buffer };

function frames(): Frame[] {
	const rows: Frame[] = []; let offset = UPSTREAM_MAGIC.length;
	while (offset < golden.length - 64) {
		const length = golden.readUInt32LE(offset); offset += 4;
		const meta = JSON.parse(golden.subarray(offset, offset + length).toString()) as Frame['meta']; offset += length;
		const blob = Buffer.from(golden.subarray(offset, offset + (meta.blobSize ?? 0))); offset += blob.length;
		rows.push({ meta, blob });
	}
	return rows;
}

function pack(rows: Frame[], extra = Buffer.alloc(0)) {
	const parts: Buffer[] = [Buffer.from(UPSTREAM_MAGIC)];
	for (const row of rows) {
		const value = Buffer.from(JSON.stringify(row.meta)); const length = Buffer.alloc(4); length.writeUInt32LE(value.length);
		parts.push(length, value, row.blob);
	}
	const body = Buffer.concat([...parts, extra]); return Buffer.concat([body, Buffer.from(hash(body))]);
}

function frame(rows: Frame[], store: string) {
	const result = rows.find(row => row.meta.store === store); if (!result) throw new Error('Missing fixture frame'); return result;
}

test('reads the unchanged pinned upstream writer fixture without inventing missing historical facts', async () => {
	expect(hash(golden)).toBe(provenance.fixtureSha256);
	const before = Buffer.from(golden);
	const result = await inspectUpstreamBackup(golden);
	expect(result).toMatchObject({ format: 'FUKUSHU-BACKUP-1', imported: false, canImport: false, exportedAt: null, currentDesiredRetention: 0.93,
																																counts: { decks: 1, questions: 2, studyStates: 1, reviewLogs: 2, importSources: 1, media: 1, imports: 1 } });
	expect(result.decks[0]).toMatchObject({ name: '本家の合成教材', questions: 2, reviewLogs: 2 });
	expect(result.binaryBytes).toBeGreaterThan(0);
	for (const row of result.history) {
		expect(row).toMatchObject({ questionSnapshot: 'unavailable', cardBefore: null, cardAfter: null, scheduler: null, correct: false, rating: 'again' });
		expect(row).not.toHaveProperty('question'); expect(row).not.toHaveProperty('questionVersion');
	}
	expect(JSON.stringify(result)).not.toContain('Current edited prompt');
	expect(JSON.stringify(result)).not.toContain('old response');
	expect(golden).toEqual(before);
	expect(() => decodeBackup(golden)).toThrow('UPSTREAM_BACKUP_UNSUPPORTED');
});

test('does not derive correctness, full state or scheduler evidence from a rating or current settings', async () => {
	const rows = frames(); frame(rows, 'reviewLogs').meta.value.rating = 'easy';
	const result = await inspectUpstreamBackup(pack(rows));
	expect(result.history.find(row => row.id === 'source-review-1')).toMatchObject({ rating: 'easy', correct: false, scheduler: null, cardAfter: null });
});

test('reports absent source ordering without assigning fabricated positions', async () => {
	const rows = frames(); delete frame(rows, 'questions').meta.value.sourceOrder;
	expect((await inspectUpstreamBackup(pack(rows))).missingQuestionOrders).toBe(1);
});

test('can inspect a valid empty snapshot without inventing settings or history', async () => {
	const result = await inspectUpstreamBackup(pack(frames().filter(row => row.meta.store === 'settings')));
	expect(result.counts.decks).toBe(0); expect(result.history).toEqual([]);
	await expect(inspectUpstreamBackup(pack([]))).rejects.toThrow('INVALID_BACKUP');
});

test.each(['checksum', 'truncated', 'legacy-json', 'native-json', 'unknown-version', 'trailing', 'utf8', 'zero-length', 'oversized-length'])('rejects invalid framing or unsupported format: %s', async kind => {
	let bad: Buffer;
	if (kind === 'checksum') { bad = Buffer.from(golden); bad[bad.length - 1] = bad.at(-1) === 48 ? 49 : 48; } else if (kind === 'truncated') bad = golden.subarray(0, golden.length - 1);
	else if (kind === 'legacy-json') bad = Buffer.from('{"format":"gift-fsrs-learning-backup","version":3}');
	else if (kind === 'native-json') bad = Buffer.from('{"format":"misskey-fukushu-deck-backup","version":1}');
	else if (kind === 'unknown-version') bad = Buffer.from(golden.toString().replace('BACKUP-1', 'BACKUP-2'));
	else if (kind === 'trailing') bad = pack(frames(), Buffer.from([1, 2]));
	else {
		const body = Buffer.from(golden.subarray(0, -64));
		if (kind === 'utf8') body[UPSTREAM_MAGIC.length + 5] = 0xff;
		else body.writeUInt32LE(kind === 'zero-length' ? 0 : 0xffffffff, UPSTREAM_MAGIC.length);
		bad = Buffer.concat([body, Buffer.from(hash(body))]);
	}
	await expect(inspectUpstreamBackup(bad)).rejects.toThrow('INVALID_BACKUP');
});

test.each(['duplicate', 'unknown-store', 'unknown-field', 'missing-settings', 'missing-question', 'missing-deck', 'missing-source', 'duplicate-source-key', 'duplicate-order', 'question-payload', 'foreign-state', 'foreign-review', 'foreign-import'])('rejects schemas or references as a whole: %s', async kind => {
	let rows = frames();
	if (kind === 'duplicate') rows.push(frame(rows, 'reviewLogs'));
	if (kind === 'unknown-store') frame(rows, 'imports').meta.store = 'unknown';
	if (kind === 'unknown-field') frame(rows, 'reviewLogs').meta.value.questionVersion = 1;
	if (kind === 'missing-settings') rows = rows.filter(row => row.meta.store !== 'settings');
	if (kind === 'missing-question') rows = rows.filter(row => row.meta.store !== 'questions');
	if (kind === 'missing-deck') rows = rows.filter(row => row.meta.store !== 'decks');
	if (kind === 'missing-source') rows = rows.filter(row => row.meta.store !== 'importSources');
	if (kind === 'duplicate-source-key' || kind === 'duplicate-order') {
		const questions = rows.filter(row => row.meta.store === 'questions');
		const field = kind === 'duplicate-source-key' ? 'sourceKey' : 'sourceOrder';
		questions[1].meta.value[field] = questions[0].meta.value[field];
	}
	if (kind === 'question-payload') (frame(rows, 'questions').meta.value.payload as Record<string, unknown>).id = 'other';
	if (kind === 'foreign-state') frame(rows, 'studyStates').meta.value.deckId = 'other';
	if (kind === 'foreign-review') frame(rows, 'reviewLogs').meta.value.deckId = 'other';
	if (kind === 'foreign-import') frame(rows, 'imports').meta.value.deckId = 'other';
	await expect(inspectUpstreamBackup(pack(rows))).rejects.toThrow('INVALID_BACKUP');
});

test.each(['missing-size', 'large-size', 'negative-size', 'media-hash', 'media-length', 'inline-media', 'inline-source', 'illegal-blob', 'missing-media-reference'])('rejects binary boundary or integrity failure: %s', async kind => {
	let rows = frames(); const media = frame(rows, 'media');
	if (kind === 'missing-size') delete media.meta.blobSize;
	if (kind === 'large-size') media.meta.blobSize = Number.MAX_SAFE_INTEGER;
	if (kind === 'negative-size') media.meta.blobSize = -1;
	if (kind === 'media-hash') media.blob[0] ^= 1;
	if (kind === 'media-length') media.meta.value.size = Number(media.meta.value.size) + 1;
	if (kind === 'inline-media') media.meta.value.blobBase64 = 'YWJj';
	if (kind === 'inline-source') frame(rows, 'importSources').meta.value.sourceArchiveBase64 = '';
	if (kind === 'illegal-blob') frame(rows, 'decks').meta.blobSize = 0;
	if (kind === 'missing-media-reference') rows = rows.filter(row => row.meta.store !== 'media');
	await expect(inspectUpstreamBackup(pack(rows))).rejects.toThrow('INVALID_BACKUP');
});

test.each([['decks', 101], ['questions', 1001], ['studyStates', 1001], ['reviewLogs', 10_001]] as const)('refuses the complete archive above the %s record limit', async (store, count) => {
	const rows = frames(); const template = frame(rows, store);
	const many = Array.from({ length: count }, (_, index) => ({ meta: { ...template.meta, value: { ...template.meta.value, [store === 'studyStates' ? 'questionId' : 'id']: `unique-${index}` } }, blob: template.blob }));
	await expect(inspectUpstreamBackup(pack([...rows.filter(row => row.meta.store !== store), ...many]))).rejects.toThrow('UPSTREAM_INSPECTION_LIMIT');
});

test('rejects oversized files before parsing', async () => {
	await expect(inspectUpstreamBackup(Buffer.alloc(MAX_BACKUP_BYTES + 1))).rejects.toThrow('BACKUP_TOO_LARGE');
});

test('limits the history sample without changing total counts or claiming that missing reviews were restored', async () => {
	const rows = frames(); const template = frame(rows, 'reviewLogs');
	const logs = Array.from({ length: 25 }, (_, index) => ({ meta: { ...template.meta, value: { ...template.meta.value, id: `review-${index}`, reviewedAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString() } }, blob: Buffer.alloc(0) }));
	const result = await inspectUpstreamBackup(pack([...rows.filter(row => row.meta.store !== 'reviewLogs'), ...logs]));
	expect(result.counts.reviewLogs).toBe(25); expect(result.history).toHaveLength(20);
	expect(result.history[0].id).toBe('review-24'); expect(result.canImport).toBe(false);
});

test('rejects the combined record limit even when every store fits its own limit', async () => {
	const rows = frames().filter(row => row.meta.store !== 'reviewLogs' && row.meta.store !== 'imports');
	for (const store of ['reviewLogs', 'imports']) {
		const template = frame(frames(), store);
		for (let index = 0; index < 10_000; index++) rows.push({ meta: { ...template.meta, value: { ...template.meta.value, id: `combined-${index}` } }, blob: Buffer.alloc(0) });
	}
	const bytes = pack(rows);
	expect(bytes.length).toBeLessThan(MAX_BACKUP_BYTES);
	await expect(inspectUpstreamBackup(bytes)).rejects.toThrow('UPSTREAM_INSPECTION_LIMIT');
});
