/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterClient } from '@orpc/server';
import { createAvatarDecorationsRouter } from '../../../backend/built/features/avatar-decorations/backend.js';

const actor = { id: 'alice', isSuspended: false, movedToUri: null };
const decoration = {
	id: 'decoration1', name: 'Crown', description: 'A crown', url: 'https://example.test/crown.png', category: null,
	updatedAt: new Date('2026-10-09T10:00:00.000Z'), roleIdsThatCanBeUsedThisDecoration: ['public1', 'private1', 'deleted1'],
};

test('anonymous decoration reads conceal private and deleted role IDs without mutating cached rows', async () => {
	const refreshes = [];
	const operations = createAvatarDecorationsRouter({
		avatarDecorationService: { getAll: async refresh => { refreshes.push(refresh); return [decoration]; } },
		readRoles: async () => [{ id: 'public1', isPublic: true }, { id: 'private1', isPublic: false }],
	});
	const anonymous = await nativeCall(operations, 'get', {}, null);
	assert.deepEqual(anonymous[0].roleIdsThatCanBeUsedThisDecoration, ['public1']);
	assert.equal(anonymous[0].category, null);
	assert.equal(Object.hasOwn(anonymous[0], 'updatedAt'), false);

	const authenticated = await nativeCall(operations, 'get', {}, actor);
	assert.deepEqual(authenticated[0].roleIdsThatCanBeUsedThisDecoration, ['public1', 'private1']);
	assert.deepEqual(decoration.roleIdsThatCanBeUsedThisDecoration, ['public1', 'private1', 'deleted1']);
	assert.deepEqual(refreshes, [true, true]);
});

test('decorations without role restrictions remain available when all configured roles are hidden', async () => {
	const operations = createAvatarDecorationsRouter({
		avatarDecorationService: { getAll: async () => [{ ...decoration, roleIdsThatCanBeUsedThisDecoration: [] }] },
		readRoles: async () => [{ id: 'private1', isPublic: false }],
	});
	const result = await nativeCall(operations, 'get', {}, null);
	assert.equal(result.length, 1);
	assert.deepEqual(result[0].roleIdsThatCanBeUsedThisDecoration, []);
});

test('decoration creation returns ISO creation time and null update time while preserving the actor', async () => {
	const calls = [];
	const operations = createAvatarDecorationsRouter({
		avatarDecorationService: { create: async (values, principal) => { calls.push({ values, principal }); return decoration; } },
		idService: { parse: id => { assert.equal(id, 'decoration1'); return { date: new Date('2026-10-08T12:00:00.000Z') }; } },
	});
	const result = await nativeCall(operations, 'create', { name: 'Crown', description: 'A crown', url: decoration.url, category: null }, actor);
	assert.equal(result.createdAt, '2026-10-08T12:00:00.000Z');
	assert.equal(result.updatedAt, null);
	assert.equal(result.category, null);
	assert.equal(calls[0].principal, actor);
	assert.equal(calls[0].values.category, null);
	assert.equal(calls[0].values.roleIdsThatCanBeUsedThisDecoration, undefined);
});

test('decoration updates distinguish clearing category from leaving it unchanged', async () => {
	const calls = [];
	const operations = createAvatarDecorationsRouter({
		avatarDecorationService: { update: async (id, values, principal) => { calls.push({ id, values, principal }); } },
	});
	assert.equal(await nativeCall(operations, 'update', { id: 'decoration1', category: null, roleIdsThatCanBeUsedThisDecoration: [] }, actor), undefined);
	assert.equal(calls[0].values.category, null);
	assert.deepEqual(calls[0].values.roleIdsThatCanBeUsedThisDecoration, []);
	assert.equal(calls[0].principal, actor);
	await nativeCall(operations, 'update', { id: 'decoration1', description: '' }, actor);
	assert.equal(calls[1].values.category, undefined);
	assert.equal(calls[1].values.roleIdsThatCanBeUsedThisDecoration, undefined);
	assert.equal(calls[1].values.description, '');
});

function nativeCall(router, key, input, principal = null) {
	return createRouterClient(router, { context: {
		credential: principal ? 'native' : null, ip: '127.0.0.1', headers: {},
		services: { authenticate: async () => [principal, null], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null },
		authorization: { rootUserId: () => principal?.id ?? null, roles: async () => [], policyAllowed: async () => true },
	} })[key](input);
}
