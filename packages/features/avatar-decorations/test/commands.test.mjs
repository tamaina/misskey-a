/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAvatarDecorationsOperations, createAvatarDecorationsRouter, avatarDecorationsContract } from '../../../backend/built/features/avatar-decorations/backend.js';

import { createRouterClient } from '@orpc/server';
import * as v from 'valibot';

function decorationOperationsFixture(deps) { return createAvatarDecorationsOperations({ avatarDecorationService: deps }); }

const updateKey = 'admin/avatar-decorations/update';
const deleteKey = 'admin/avatar-decorations/delete';

function invoke(operations, key, input, ...actorArg) {
	const actor = actorArg.length === 0 ? { id: 'alice' } : actorArg[0];
	const client = createRouterClient(createAvatarDecorationsRouter(), { context: {
		credential: 'native', ip: '127.0.0.1', headers: {}, operations: { avatarDecorations: operations },
		services: { authenticate: async () => [actor ?? null, null], limitActor: () => null },
		authorization: { rootUserId: () => null, roles: async () => [], policyAllowed: async () => true },
	} });
	return client[key === updateKey ? 'update' : 'delete'](input);
}

test('native decoration patches preserve nullable category, empty descriptions and required IDs', () => {
	const update = avatarDecorationsContract.update['~orpc'].inputSchema;
	assert.deepEqual(v.parse(update, { id: 'decoration1', category: null, description: '', roleIdsThatCanBeUsedThisDecoration: ['role with spaces'], future: true }), { id: 'decoration1', category: null, description: '', roleIdsThatCanBeUsedThisDecoration: ['role with spaces'] });
	for (const input of [{}, { id: 'bad-id!' }, { id: 'decoration1', name: '' }, { id: 'decoration1', url: '' }]) assert.equal(v.safeParse(update, input).success, false);
	assert.equal(v.safeParse(avatarDecorationsContract.delete['~orpc'].inputSchema, {}).success, false);
});

test('update and delete use the trusted full actor, preserve legacy patch fields, await ports, and return void', async () => {
	const actor = { id: 'trusted-user', moderatorContext: { source: 'request' } };
	const calls = [];
	let releaseUpdate;
	let resolveUpdateStarted;
	const updateStarted = new Promise(resolve => { resolveUpdateStarted = resolve; });
	const feature = decorationOperationsFixture({
		update: (id, values, actorArg) => new Promise(resolve => {
			calls.push(['update', id, values, actorArg]);
			releaseUpdate = resolve;
			resolveUpdateStarted();
		}),
		delete: async (id, actorArg) => { calls.push(['delete', id, actorArg]); },
	});

	let settled = false;
	const pending = invoke(feature, updateKey, {
		id: 'decoration1',
		name: 'name',
		url: 'https://example.test/image.png',
		category: null,
		roleIdsThatCanBeUsedThisDecoration: ['role with spaces'],
		actor: { id: 'spoofed' },
		ignored: true,
	}, actor).then(value => { settled = true; return value; });
	await updateStarted;
	assert.equal(settled, false);
	assert.deepEqual(calls[0], ['update', 'decoration1', {
		name: 'name',
		description: undefined,
		url: 'https://example.test/image.png',
		roleIdsThatCanBeUsedThisDecoration: ['role with spaces'],
		category: null,
	}, actor]);
	releaseUpdate();
	assert.equal(await pending, undefined);

	assert.equal(await invoke(feature, deleteKey, { id: 'decoration2' }, actor), undefined);
	assert.deepEqual(calls[1], ['delete', 'decoration2', actor]);
});

test('missing credentials fail before service calls and command inputs keep legacy validation limits', async () => {
	const calls = [];
	const feature = decorationOperationsFixture({
		update: async (...args) => { calls.push(args); },
		delete: async (...args) => { calls.push(args); },
	});

	for (const key of [updateKey, deleteKey]) {
		for (const actor of [undefined, null]) {
			await assert.rejects(invoke(feature, key, { id: 'decoration1' }, actor));
		}
	}
	assert.deepEqual(calls, []);

	await assert.rejects(invoke(feature, updateKey, { id: 'decoration1', name: '' }));
	await assert.rejects(invoke(feature, updateKey, { id: 'decoration1', url: '' }));
	await assert.rejects(invoke(feature, updateKey, { id: 'bad-id!' }));
	assert.equal(await invoke(feature, updateKey, { id: 'decoration1', category: null }), undefined);
});
