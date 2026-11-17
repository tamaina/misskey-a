/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { UpstreamCompatibilitySession } from '../../backend/pilot/upstream-session.js';
import { readUpstreamArchive, UPSTREAM_MAGIC } from '../../shared/upstream-reader.js';
import { MAX_BACKUP_BYTES } from '../../shared/backup.schema.js';
import type { CompatibilityReviewInput } from '../../backend/pilot/upstream-session.js';
import type { UpstreamFrame } from '../../shared/upstream-reader.js';

const fixture = (name: string) => readFileSync(`../features/games/fukushu/test/backend/fixtures/actual-upstream/${name}`);
const bytes = fixture('actual-upstream.fukushu');
const provenance = JSON.parse(fixture('provenance.json').toString());
const expected = JSON.parse(fixture('expected-continuation.json').toString());
const request: CompatibilityReviewInput = expected.reset.request;
const sha256 = async (value: Uint8Array) => createHash('sha256').update(value).digest('hex');
const archive = () => readUpstreamArchive(bytes, sha256);
// Frame construction is for adversarial tests, not fixture provenance.

async function pack(frames: UpstreamFrame[]) {
	const parts: Uint8Array[] = [new TextEncoder().encode(UPSTREAM_MAGIC)];
	for (const frame of frames) {
		const json = Buffer.from(JSON.stringify({ store: frame.store, value: frame.value, ...(frame.blob === undefined ? {} : { blobSize: frame.blob.length }) }));
		const size = Buffer.alloc(4); size.writeUInt32LE(json.length);
		parts.push(size, json);
		if (frame.blob !== undefined) parts.push(frame.blob);
	}
	const payload = Buffer.concat(parts);
	return Buffer.concat([payload, Buffer.from(await sha256(payload))]);
}

describe('upstream compatibility pilot using actual Chrome/IndexedDB output', () => {
	test('fixture provenance and source-generated Anki IDs/current reset state', async () => {
		expect(await sha256(bytes)).toBe(provenance.backupSha256);
		const session = await UpstreamCompatibilitySession.open(bytes);
		const records = session.snapshot();
		expect(records.reviewLogs.filter(row => row.id.startsWith('anki:'))).toHaveLength(36);
		expect(records.reviewLogs.filter(row => row.questionId === request.questionId)).toHaveLength(1);
		expect(records.studyStates.find(row => row.questionId === request.questionId)?.card.reps).toBe(0);
		expect(records.settings[0].desiredRetention).toBe(0.87);
		expect(session.export()).toEqual(new Uint8Array(bytes));
	});

	test.each(['reset', 'apkg'])('%s continues from current state with source-equivalent scheduling', async key => {
		const session = await UpstreamCompatibilitySession.open(bytes);
		const old = session.snapshot();
		const result = await session.recordReview(expected[key].request);
		expect(result).toEqual(expected[key].result);
		expect(result.revision).toBe(1); // Not the lifetime reps or imported log count.
		const next = session.snapshot();
		expect(next.reviewLogs.slice(0, old.reviewLogs.length)).toEqual(old.reviewLogs);
		for (const store of ['questions', 'decks', 'settings', 'imports', 'importSources', 'media'] as const) expect(next[store]).toEqual(old[store]);
		expect(next.studyStates.filter(row => row.questionId !== result.record.questionId)).toEqual(old.studyStates.filter(row => row.questionId !== result.record.questionId));
		const original = (await archive()).frames().filter(frame => frame.blob !== undefined);
		const restored = (await readUpstreamArchive(session.export(), sha256)).frames().filter(frame => frame.blob !== undefined);
		expect(restored).toEqual(original); // Media + original APKG, not just metadata.
	});

	test('same and simultaneous retries append only once', async () => {
		const session = await UpstreamCompatibilitySession.open(bytes);
		const results = await Promise.all([session.recordReview(request), session.recordReview(request)]);
		expect(results[1]).toEqual(results[0]);
		expect(await session.recordReview(request)).toEqual(results[0]);
		expect(session.snapshot().reviewLogs).toHaveLength(38);
	});

	test('changed request, stale revision and competing writes do not double advance', async () => {
		const session = await UpstreamCompatibilitySession.open(bytes);
		const results = await Promise.allSettled([session.recordReview(request), session.recordReview({ ...request, requestId: expected.apkg.request.requestId })]);
		expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
		expect(session.snapshot().reviewLogs).toHaveLength(38);
		await expect(session.recordReview({ ...request, rating: 'hard' })).rejects.toMatchObject({ code: 'REQUEST_CONFLICT' });
		await expect(session.recordReview({ ...request, requestId: expected.apkg.request.requestId })).rejects.toMatchObject({ code: 'STALE_STATE' });
	});

	test('reopening export retains new log identity and refuses replay without durable receipt', async () => {
		const session = await UpstreamCompatibilitySession.open(bytes);
		await session.recordReview(request);
		const reopened = await UpstreamCompatibilitySession.open(session.export());
		await expect(reopened.recordReview(request)).rejects.toMatchObject({ code: 'HISTORY_ID_EXISTS' });
		expect(reopened.snapshot()).toEqual(session.snapshot());
	});

	test('external mutation cannot change the retained archive or receipt', async () => {
		const input = new Uint8Array(bytes);
		const pending = UpstreamCompatibilitySession.open(input);
		input.fill(0);
		const session = await pending;
		session.export().fill(0);
		session.snapshot().reviewLogs.length = 0;
		const result = await session.recordReview(request);
		result.state.card.reps = 99;
		expect(await session.recordReview(request)).toEqual(expected.reset.result);
	});

	test('failure to fit one new log leaves source untouched', async () => {
		const session = await UpstreamCompatibilitySession.open(bytes);
		await expect(session.recordReview({ ...request, answers: ['x'.repeat(MAX_BACKUP_BYTES)] })).rejects.toMatchObject({ code: 'BACKUP_TOO_LARGE' });
		expect(session.export()).toEqual(new Uint8Array(bytes));
		expect(await session.recordReview(request)).toEqual(expected.reset.result);
	});

	test('schema defaults are not written into untouched source records', async () => {
		const frames = (await archive()).frames();
		delete frames.find(frame => frame.store === 'settings')!.value.checkpointInterval;
		const session = await UpstreamCompatibilitySession.open(await pack(frames));
		expect(session.snapshot().settings[0].checkpointInterval).toBe(20);
		await session.recordReview(request);
		const output = await readUpstreamArchive(session.export(), sha256);
		expect(output.frames().find(frame => frame.store === 'settings')!.value).not.toHaveProperty('checkpointInterval');
	});

	test('suspension, malformed input and damaged archive cannot change data', async () => {
		const frames = (await archive()).frames();
		const state = frames.find(frame => frame.store === 'studyStates' && frame.value.questionId === request.questionId)!;
		state.value.suspended = true; state.value.suspendedKey = 1;
		const session = await UpstreamCompatibilitySession.open(await pack(frames));
		const original = session.export();
		await expect(session.recordReview(request)).rejects.toMatchObject({ code: 'NOT_STUDYABLE' });
		await expect(session.recordReview({ ...request, durationMs: -1 })).rejects.toThrow();
		expect(session.export()).toEqual(original);
		const damaged = new Uint8Array(bytes); damaged[100] ^= 1;
		await expect(UpstreamCompatibilitySession.open(damaged)).rejects.toMatchObject({ code: 'INVALID_BACKUP' });
	});
});
