/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { afterEach, expect, test, vi } from 'vitest';
import { inspectUpstreamBytes } from '../shared/upstream-reader.js';
import { inspectLocalUpstream, LOCAL_ARCHIVE_BYTES } from './upstream-local.js';

afterEach(() => vi.unstubAllGlobals());
const bytes = readFileSync('../features/games/fukushu/test/backend/fixtures/upstream-backup.fukushu');

test('local inspection reads the upstream writer fixture without network or browser storage', async () => {
	const fetch = vi.fn(() => { throw new Error('Network forbidden'); }); vi.stubGlobal('fetch', fetch);
	const local = vi.spyOn(Storage.prototype, 'setItem');
	try {
		const result = await inspectLocalUpstream(new File([new Uint8Array(bytes)], 'original.fukushu'));
		expect(result).toEqual(await inspectUpstreamBytes(bytes, async data => createHash('sha256').update(data).digest('hex')));
		expect(result).toMatchObject({ imported: false, canImport: false, counts: { decks: 1, questions: 2, reviewLogs: 2 } });
		expect(result.history.every(row => row.questionSnapshot === 'unavailable' && row.cardBefore === null && row.scheduler === null)).toBe(true);
		expect(fetch).not.toHaveBeenCalled(); expect(local).not.toHaveBeenCalled();
	} finally { local.mockRestore(); }
});

test('rejects file size and extension before reading file contents', async () => {
	for (const [name, size, code] of [['big.fukushu', LOCAL_ARCHIVE_BYTES + 1, 'BACKUP_TOO_LARGE'], ['unknown.json', 1, 'INVALID_BACKUP']] as const) {
		const arrayBuffer = vi.fn();
		await expect(inspectLocalUpstream({ name, size, arrayBuffer } as unknown as File)).rejects.toThrow(code);
		expect(arrayBuffer).not.toHaveBeenCalled();
	}
});

test('local inspection rejects altered bytes rather than returning a partial report', async () => {
	const bad = new Uint8Array(bytes); bad[bad.length - 1] ^= 1;
	await expect(inspectLocalUpstream(new File([bad], 'altered.fukushu'))).rejects.toThrow('INVALID_BACKUP');
});

function withExtraFrames(frames: Buffer[]) {
	const payload = Buffer.concat([bytes.subarray(0, -64), ...frames]);
	const digest = createHash('sha256').update(payload).digest('hex');
	return new File([new Uint8Array(payload), digest], 'scale.fukushu');
}

function frame(row: object) {
	const json = Buffer.from(JSON.stringify(row));
	const length = Buffer.alloc(4);
	length.writeUInt32LE(json.length);
	return Buffer.concat([length, json]);
}

test('reads media crossing chunk boundaries without a whole-file read', async () => {
	const blob = Buffer.alloc(9 * 1024 * 1024, 42);
	const id = createHash('sha256').update(blob).digest('hex');
	const row = frame({ store: 'media', value: { id, blobBase64: '', mimeType: 'audio/wav', size: blob.length }, blobSize: blob.length });
	const file = withExtraFrames([row, blob]);
	const whole = vi.spyOn(file, 'arrayBuffer');
	const slices = vi.spyOn(file, 'slice');
	const result = await inspectLocalUpstream(file);
	expect(result.counts.media).toBe(2);
	expect(whole).not.toHaveBeenCalled();
	expect(slices.mock.calls.every(([start, end]) => typeof end === 'number' && typeof start === 'number' && end - start <= 256 * 1024)).toBe(true);
	blob[0] ^= 1;
	await expect(inspectLocalUpstream(withExtraFrames([row, blob]))).rejects.toThrow('INVALID_BACKUP');
}, 20_000);

test('stops before parsing over-budget metadata and on cancellation', async () => {
	const tooLong = Buffer.alloc(4);
	tooLong.writeUInt32LE(8 * 1024 * 1024 + 1);
	const file = withExtraFrames([tooLong, Buffer.alloc(8 * 1024 * 1024 + 1)]);
	await expect(inspectLocalUpstream(file)).rejects.toThrow('UPSTREAM_INSPECTION_LIMIT');
	const controller = new AbortController();
	controller.abort();
	const slice = vi.spyOn(file, 'slice');
	await expect(inspectLocalUpstream(file, controller.signal)).rejects.toThrow();
	expect(slice).not.toHaveBeenCalled();
});

test('keeps duplicate IDs and missing references invalid even with a correct trailer', async () => {
	const block = { store: 'imports', value: { added: 2, changed: 0, deckId: 'source-deck', disabled: 0, id: 'import-operation', importedAt: '2026-09-11T00:00:00.000Z', sourceHash: 'synthetic-source-hash' } };
	await expect(inspectLocalUpstream(withExtraFrames([frame(block)]))).rejects.toThrow('INVALID_BACKUP');
	await expect(inspectLocalUpstream(withExtraFrames([frame({ ...block, value: { ...block.value, id: 'new', deckId: 'missing' } })]))).rejects.toThrow('INVALID_BACKUP');
});

test('inspects more than 1,000 distinct cards and study states on this device', async () => {
	const templates = new Map<string, Record<string, unknown>>();
	for (let pos = bytes.indexOf('\n') + 1; pos < bytes.length - 64;) {
		const size = bytes.readUInt32LE(pos);
		pos += 4;
		const row = JSON.parse(bytes.toString('utf8', pos, pos + size));
		pos += size + (row.blobSize ?? 0);
		if (row.store === 'studyStates' || row.value.kind === 'multiple-choice') templates.set(row.store, row.value);
	}
	const question = templates.get('questions');
	if (!question) throw new Error('Question fixture missing');
	const extra: Buffer[] = [];
	for (let i = 0; i < 1500; i++) {
		const id = 'anki:scale:' + i;
		extra.push(frame({ store: 'questions', value: { ...question, id, sourceKey: id, sourceOrder: i + 10, payload: { ...(question.payload as object), id, sourceKey: id } } }));
		extra.push(frame({ store: 'studyStates', value: { ...templates.get('studyStates'), questionId: id } }));
	}
	expect((await inspectLocalUpstream(withExtraFrames(extra))).counts).toMatchObject({ questions: 1502, studyStates: 1501, reviewLogs: 2 });
});

test('matches the snapshot report for the pinned IndexedDB/APKG fixture', async () => {
	const original = readFileSync('../features/games/fukushu/test/backend/fixtures/actual-upstream/actual-upstream.fukushu');
	const file = new File([new Uint8Array(original)], 'actual-upstream.fukushu');
	const expected = await inspectUpstreamBytes(original, async data => createHash('sha256').update(data).digest('hex'));
	expect(await inspectLocalUpstream(file)).toEqual(expected);
});
