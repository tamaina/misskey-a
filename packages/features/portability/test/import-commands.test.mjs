/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPortabilityImportCommands, legacyPortabilityImportSchemas } from '../../../backend/built/features/portability/backend.js';

const actor = { id: 'trusted123', data: 'kept' };
const file = { id: 'file123', size: 12, url: 'https://example.test/file' };

function makeError(definition) {
	const error = new Error(definition.message);
	error.definition = definition;
	error.code = definition.code;
	error.id = definition.id;
	return error;
}

function createFixture(overrides = {}) {
	const calls = [];
	const deps = {
		userExists: async (...args) => { calls.push(['userExists', ...args]); return true; },
		findOwnedFile: async (...args) => { calls.push(['findOwnedFile', ...args]); return file; },
		countAntennas: async (...args) => { calls.push(['countAntennas', ...args]); return 1; },
		getAntennaLimit: async (...args) => { calls.push(['getAntennaLimit', ...args]); return 10; },
		downloadTextFile: async (...args) => { calls.push(['downloadTextFile', ...args]); return JSON.stringify([{ id: 'antenna1', userListAccts: null }]); },
		isMovingDuringGracePeriod: async (...args) => { calls.push(['isMovingDuringGracePeriod', ...args]); return false; },
		createImportAntennasJob: (...args) => { calls.push(['createImportAntennasJob', ...args]); },
		createImportBlockingJob: (...args) => { calls.push(['createImportBlockingJob', ...args]); },
		createImportFollowingJob: (...args) => { calls.push(['createImportFollowingJob', ...args]); },
		createImportMutingJob: (...args) => { calls.push(['createImportMutingJob', ...args]); },
		createImportUserListsJob: (...args) => { calls.push(['createImportUserListsJob', ...args]); },
		createError: makeError,
		...overrides,
	};
	return { calls, feature: createPortabilityImportCommands(deps) };
}

function invoke(feature, route, input = { fileId: file.id }, trustedActor = actor) {
	return feature[route](input, { context: trustedActor === undefined ? undefined : { actor: trustedActor } });
}

test('legacy import schemas retain misskey IDs, optional withReplies and loose extra properties', () => {
	const id = { type: 'string', format: 'misskey:id' };
	for (const route of ['i/import-antennas', 'i/import-blocking', 'i/import-muting', 'i/import-user-lists']) {
		assert.deepEqual(legacyPortabilityImportSchemas[route].input, {
			type: 'object', properties: { fileId: id }, required: ['fileId'],
		});
	}
	assert.deepEqual(legacyPortabilityImportSchemas['i/import-following'].input, {
		type: 'object', properties: { fileId: id, withReplies: { type: 'boolean' } }, required: ['fileId'],
	});
});

test('portability contract validates file IDs and optional booleans before any import side effects', async () => {
	const { feature, calls } = createFixture();
	await assert.rejects(invoke(feature, 'i/import-antennas', { fileId: 'bad/id' }));
	await assert.rejects(invoke(feature, 'i/import-following', { fileId: file.id, withReplies: 'yes' }));
	assert.deepEqual(calls, []);
});

test('antennas import preserves user/file/parse/count/limit ordering and fire-and-forget queueing', async () => {
	const { feature, calls } = createFixture();
	const result = await invoke(feature, 'i/import-antennas', { fileId: file.id, extra: true });
	assert.equal(result, undefined);
	assert.deepEqual(calls, [
		['userExists', actor.id], ['findOwnedFile', file.id, actor.id],
		['downloadTextFile', file.url],
		['countAntennas', actor.id], ['getAntennaLimit', actor.id],
		['createImportAntennasJob', actor, [{ id: 'antenna1', userListAccts: null }]],
	]);

	let release;
	const pending = new Promise(resolve => { release = resolve; });
	const queued = createFixture({ createImportBlockingJob: () => { calls.push(['pendingQueue']); return pending; } });
	const returned = await Promise.race([
		invoke(queued.feature, 'i/import-blocking'),
		new Promise((_, reject) => setTimeout(() => reject(new Error('queue was awaited')), 50)),
	]);
	assert.equal(returned, undefined);
	release();
});

test('CSV imports await the move check, enforce legacy size cutoff and pass optional replies unchanged', async () => {
	for (const [route, job, args] of [
		['i/import-blocking', 'createImportBlockingJob', [actor, file.id]],
		['i/import-following', 'createImportFollowingJob', [actor, file.id, undefined]],
		['i/import-muting', 'createImportMutingJob', [actor, file.id]],
		['i/import-user-lists', 'createImportUserListsJob', [actor, file.id]],
	]) {
		const { feature, calls } = createFixture();
		assert.equal(await invoke(feature, route, { fileId: file.id, extra: 'legacy accepted' }), undefined);
		assert.deepEqual(calls, [
			['findOwnedFile', file.id, actor.id],
			['isMovingDuringGracePeriod', actor],
			[job, ...args],
		]);
	}

	const tooLarge = createFixture({ findOwnedFile: async () => ({ ...file, size: 64 * 1024 + 1 }) });
	await assert.rejects(invoke(tooLarge.feature, 'i/import-blocking'), error => error.code === 'TOO_BIG_FILE');
	assert.equal(tooLarge.calls.some(([method]) => method === 'createImportBlockingJob'), false);

	const moving = createFixture({
		findOwnedFile: async () => ({ ...file, size: 32 * 1024 * 1024 }),
		isMovingDuringGracePeriod: async () => true,
	});
	assert.equal(await invoke(moving.feature, 'i/import-following', { fileId: file.id, withReplies: true }), undefined);
	assert.deepEqual(moving.calls.at(-1), ['createImportFollowingJob', actor, file.id, true]);
});

test('empty/missing files stop before move validation or queueing; antenna cap is exclusive at the limit', async () => {
	for (const missing of [null, undefined]) {
		const fixture = createFixture({ findOwnedFile: async () => missing });
		await assert.rejects(invoke(fixture.feature, 'i/import-blocking'), error => error.code === 'NO_SUCH_FILE');
		assert.equal(fixture.calls.some(([method]) => method === 'isMovingDuringGracePeriod'), false);
	}
	const empty = createFixture({ findOwnedFile: async () => ({ ...file, size: 0 }) });
	await assert.rejects(invoke(empty.feature, 'i/import-user-lists'), error => error.code === 'EMPTY_FILE');
	assert.equal(empty.calls.some(([method]) => method === 'isMovingDuringGracePeriod'), false);

	const atLimit = createFixture({ countAntennas: async () => 9, getAntennaLimit: async () => 10 });
	await assert.rejects(invoke(atLimit.feature, 'i/import-antennas'), error => error.code === 'TOO_MANY_ANTENNAS');
	assert.equal(atLimit.calls.some(([method]) => method === 'createImportAntennasJob'), false);
});
