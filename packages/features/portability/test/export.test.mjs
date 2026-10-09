/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as v from 'valibot';
import { createPortabilityOperations, portabilityApiContract } from '../../../backend/built/features/portability/backend.js';

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

async function call(feature, route, input = {}, actorId = 'trusted-user') {
	return feature[route](v.parse(portabilityApiContract[route]['~orpc'].inputSchema, input), { id: actorId });
}

test('native following input retains false flag defaults', () => {
	assert.deepEqual(v.parse(portabilityApiContract['i/export-following']['~orpc'].inputSchema, {}), { excludeMuting: false, excludeInactive: false });
});

test('each export selects only its matching job and following uses false defaults', async () => {
	const { dependencies, calls } = makeDependencies();
	const feature = createPortabilityOperations(dependencies);

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
	const feature = createPortabilityOperations(dependencies);
	await Promise.all([
		call(feature, 'i/export-notes', { actor: { id: 'spoofed-one' }, userId: 'spoofed-two' }, 'trusted-one'),
		call(feature, 'i/export-notes', { actor: { id: 'spoofed-two' }, userId: 'spoofed-one' }, 'trusted-two'),
	]);
	assert.deepEqual(calls, [{ id: 'trusted-one' }, { id: 'trusted-two' }]);
});

test('queue promises are deliberately fire-and-forget', async () => {
	let invoked = false;
	const neverSettles = new Promise(() => {});
	const { dependencies } = makeDependencies({
		createExportAntennasJob: () => { invoked = true; return neverSettles; },
	});
	const feature = createPortabilityOperations(dependencies);
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
	const feature = createPortabilityOperations(dependencies);
	await assert.rejects(call(feature, 'i/export-blocking'), candidate => candidate === error);
	assert.deepEqual(calls, [{ method: 'createExportBlockingJob', args: [] }]);
});
