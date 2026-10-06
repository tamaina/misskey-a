/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPortability, legacyPortabilitySchemas } from '../../../backend/built/features/portability/backend.js';

const routeMethods = {
	'i/export-antennas': 'createExportAntennasJob',
	'i/export-blocking': 'createExportBlockingJob',
	'i/export-clips': 'createExportClipsJob',
	'i/export-favorites': 'createExportFavoritesJob',
	'i/export-following': 'createExportFollowingJob',
	'i/export-mute': 'createExportMuteJob',
	'i/export-notes': 'createExportNotesJob',
	'i/export-user-lists': 'createExportUserListsJob',
};

function makeDependencies(overrides = {}) {
	const calls = [];
	const dependencies = Object.fromEntries(Object.values(routeMethods).map(method => [method, (...args) => {
		calls.push({ method, args });
		return Promise.resolve();
	}]));
	return { dependencies: { ...dependencies, ...overrides }, calls };
}

function call(feature, route, input = {}, actorId = 'trusted-user') {
	return feature[route](input, { context: { actor: { id: actorId } } });
}

test('legacy inputs retain empty-object schemas and following flag defaults', () => {
	for (const route of Object.keys(routeMethods).filter(route => route !== 'i/export-following')) {
		assert.deepEqual(legacyPortabilitySchemas[route].input, {
			type: 'object',
			properties: {},
			additionalProperties: true,
		});
	}
	assert.deepEqual(legacyPortabilitySchemas['i/export-following'].input, {
		type: 'object',
		properties: {
			excludeMuting: { type: 'boolean', default: false },
			excludeInactive: { type: 'boolean', default: false },
		},
		required: [],
	});
});

test('each export selects only its matching job and following uses false defaults', async () => {
	const { dependencies, calls } = makeDependencies();
	const feature = createPortability(dependencies);

	for (const [route, method] of Object.entries(routeMethods)) {
		const output = await call(feature, route);
		assert.equal(output, undefined);
		const expectedArgs = route === 'i/export-following'
			? [{ id: 'trusted-user' }, false, false]
			: [{ id: 'trusted-user' }];
		assert.deepEqual(calls.at(-1), { method, args: expectedArgs });
	}

	await call(feature, 'i/export-following', { excludeMuting: true, excludeInactive: true });
	assert.deepEqual(calls.at(-1), {
		method: 'createExportFollowingJob',
		args: [{ id: 'trusted-user' }, true, true],
	});
	assert.equal(calls.length, 9);
});

test('trusted context is isolated across concurrent calls and request input cannot spoof the actor', async () => {
	const calls = [];
	const { dependencies } = makeDependencies({
		createExportNotesJob: actor => { calls.push(actor); return Promise.resolve(); },
	});
	const feature = createPortability(dependencies);
	await Promise.all([
		feature['i/export-notes']({ actor: { id: 'spoofed-one' }, userId: 'spoofed-two' }, { context: { actor: { id: 'trusted-one' } } }),
		feature['i/export-notes']({ actor: { id: 'spoofed-two' }, userId: 'spoofed-one' }, { context: { actor: { id: 'trusted-two' } } }),
	]);
	assert.deepEqual(calls, [{ id: 'trusted-one' }, { id: 'trusted-two' }]);
});

test('missing or malformed actor context fails before any queue side effect', async () => {
	const { dependencies, calls } = makeDependencies();
	const feature = createPortability(dependencies);
	for (const options of [
		undefined,
		null,
		{},
		{ context: undefined },
		{ context: {} },
		{ context: { actor: null } },
		{ context: { actor: { id: '' } } },
		{ context: { actor: { id: 7 } } },
	]) {
		await assert.rejects(feature['i/export-notes']({}, options), /authenticated actor is required/i);
	}
	assert.deepEqual(calls, []);
});

test('queue promises are deliberately fire-and-forget', async () => {
	let invoked = false;
	const neverSettles = new Promise(() => {});
	const { dependencies } = makeDependencies({
		createExportAntennasJob: () => { invoked = true; return neverSettles; },
	});
	const feature = createPortability(dependencies);
	const result = await Promise.race([
		call(feature, 'i/export-antennas').then(() => 'handler-finished'),
		new Promise(resolve => setTimeout(() => resolve('handler-blocked'), 50)),
	]);
	assert.equal(invoked, true);
	assert.equal(result, 'handler-finished');
});

test('synchronous queue errors propagate without retrying or starting another job', async () => {
	const error = new Error('queue unavailable');
	const { dependencies, calls } = makeDependencies({
		createExportBlockingJob: () => { calls.push({ method: 'createExportBlockingJob', args: [] }); throw error; },
	});
	const feature = createPortability(dependencies);
	await assert.rejects(call(feature, 'i/export-blocking'), candidate => candidate === error);
	assert.deepEqual(calls, [{ method: 'createExportBlockingJob', args: [] }]);
});
