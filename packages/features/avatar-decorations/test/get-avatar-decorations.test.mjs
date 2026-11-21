/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterClient } from '@orpc/server';
import { createAvatarDecorationsRouter, avatarDecorationsContract } from '../../../backend/built/features/avatar-decorations/backend.js';

import * as v from 'valibot';

function decorationReadFixture(deps) { return createAvatarDecorationsRouter({ avatarDecorationService: { getAll: deps.readDecorations }, readRoles: deps.readRoles }); }

const decorationsFixture = [
	{
		id: 'first', name: 'First', description: 'First decoration', url: 'https://example.test/first.png',
		roleIdsThatCanBeUsedThisDecoration: ['public-b', 'private', 'missing', 'public-a'], category: 'seasonal',
	},
	{
		id: 'second', name: 'Second', description: 'Second decoration', url: 'https://example.test/second.png',
		roleIdsThatCanBeUsedThisDecoration: ['private'], category: null,
	},
];
const rolesFixture = [
	{ id: 'private', isPublic: false },
	{ id: 'public-a', isPublic: true },
	{ id: 'public-b', isPublic: true },
];

function call(feature, input = {}, authenticated = false) {
	return nativeCall(feature, 'get', input, authenticated ? { id: 'alice' } : null);
}

test('construction has no I/O; each call reads decorations then roles and preserves decoration order', async () => {
	const calls = [];
	let decorationRead = 0;
	let rolesRead = 0;
	const feature = decorationReadFixture({
		readDecorations: async () => {
			calls.push('decorations');
			decorationRead++;
			return decorationsFixture;
		},
		readRoles: async () => {
			calls.push('roles');
			rolesRead++;
			return rolesFixture;
		},
	});

	assert.deepEqual(calls, []);
	assert.deepEqual(await call(feature), [
		{
			id: 'first', name: 'First', description: 'First decoration', url: 'https://example.test/first.png',
			roleIdsThatCanBeUsedThisDecoration: ['public-b', 'public-a'], category: 'seasonal',
		},
		{
			id: 'second', name: 'Second', description: 'Second decoration', url: 'https://example.test/second.png',
			roleIdsThatCanBeUsedThisDecoration: [], category: null,
		},
	]);
	assert.deepEqual(calls, ['decorations', 'roles']);
	assert.deepEqual(await call(feature, {}, true), [
		{ ...decorationsFixture[0], roleIdsThatCanBeUsedThisDecoration: ['public-b', 'private', 'public-a'] },
		decorationsFixture[1],
	]);
	assert.deepEqual(calls, ['decorations', 'roles', 'decorations', 'roles']);
	assert.equal(decorationRead, 2);
	assert.equal(rolesRead, 2);
});

test('opposite authentication contexts on concurrent calls remain isolated', async () => {
	let releaseDecorations;
	let decorationReads = 0;
	const decorationsReady = new Promise(resolve => { releaseDecorations = resolve; });
	const feature = decorationReadFixture({
		readDecorations: async () => {
			decorationReads++;
			if (decorationReads === 2) releaseDecorations();
			await decorationsReady;
			return decorationsFixture;
		},
		readRoles: async () => rolesFixture,
	});

	const [anonymous, authenticated] = await Promise.all([
		call(feature, {}, false),
		call(feature, {}, true),
	]);
	assert.deepEqual(anonymous[0].roleIdsThatCanBeUsedThisDecoration, ['public-b', 'public-a']);
	assert.deepEqual(authenticated[0].roleIdsThatCanBeUsedThisDecoration, ['public-b', 'private', 'public-a']);
});

test('authentication-shaped input cannot reveal private role IDs', async () => {
	const feature = decorationReadFixture({
		readDecorations: async () => decorationsFixture,
		readRoles: async () => rolesFixture,
	});

	const result = await nativeCall(feature, 'get', { authenticated: true }, null);
	assert.deepEqual(result[0].roleIdsThatCanBeUsedThisDecoration, ['public-b', 'public-a']);
});

test('anonymous principal reveals public roles only', async () => {
	const feature = decorationReadFixture({
		readDecorations: async () => decorationsFixture,
		readRoles: async () => rolesFixture,
	});

	const result = await nativeCall(feature, 'get', {}, null);
	assert.deepEqual(result[0].roleIdsThatCanBeUsedThisDecoration, ['public-b', 'public-a']);
});

test('dependency failures propagate in read order without starting the next read', async () => {
	const decorationFailure = new Error('decoration read failed');
	const calls = [];
	const firstFeature = decorationReadFixture({
		readDecorations: async () => { calls.push('decorations'); throw decorationFailure; },
		readRoles: async () => { calls.push('roles'); return rolesFixture; },
	});
	await assert.rejects(call(firstFeature), error => error === decorationFailure);
	assert.deepEqual(calls, ['decorations']);

	const roleFailure = new Error('role read failed');
	const secondFeature = decorationReadFixture({
		readDecorations: async () => { calls.push('decorations-2'); return decorationsFixture; },
		readRoles: async () => { calls.push('roles-2'); throw roleFailure; },
	});
	await assert.rejects(call(secondFeature), error => error === roleFailure);
	assert.deepEqual(calls, ['decorations', 'decorations-2', 'roles-2']);
});

test('an absent category stays absent in the portable response contract', () => {
	const withoutCategory = { ...decorationsFixture[0] };
	delete withoutCategory.category;
	const result = v.parse(avatarDecorationsContract.get['~orpc'].outputSchema, [withoutCategory]);
	assert.equal(Object.hasOwn(result[0], 'category'), false);
});

function nativeCall(router, key, input, principal = null) {
	return createRouterClient(router, { context: {
		credential: principal ? 'native' : null, ip: '127.0.0.1', headers: {},
		services: { authenticate: async () => [principal, null], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null },
		authorization: { rootUserId: () => principal?.id ?? null, roles: async () => [], policyAllowed: async () => true },
	} })[key](input);
}
