/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { createEmojis } from '@features/emojis/backend';
import { createEndpoint as createEmojiEndpoint, meta as emojiMeta } from '@features/emojis/backend/endpoints/emoji.js';
import { createEndpoint as createEmojisEndpoint, meta as emojisMeta } from '@features/emojis/backend/endpoints/emojis.js';
import { createAvatarDecorations } from '@features/avatar-decorations/backend';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createEndpoint as createDecorationsEndpoint, meta as decorationsMeta } from '@features/avatar-decorations/backend/endpoints/get-avatar-decorations.js';
import { createStatistics } from '@features/statistics/backend';
import { createEndpoint as createStatsEndpoint, meta as statsMeta } from '@features/statistics/backend/endpoints/stats.js';
import { createInstance } from '@features/instance/backend';
import type { EndpointDescriptor, ReadEndpoints } from '@features/instance/backend';
import { createEndpoint as createPingEndpoint, meta as pingMeta } from '@features/instance/backend/endpoints/ping.js';
import { createEndpoint as createOnlineUsersCountEndpoint, meta as onlineUsersCountMeta } from '@features/instance/backend/endpoints/get-online-users-count.js';
import { createEndpoint as createServerInfoEndpoint, meta as serverInfoMeta } from '@features/instance/backend/endpoints/server-info.js';
import { createEndpoint as createEndpointIntrospectionEndpoint, meta as endpointMeta } from '@features/instance/backend/endpoints/endpoint.js';
import { createEndpoint as createEndpointsEndpoint, meta as endpointsMeta } from '@features/instance/backend/endpoints/endpoints.js';

function makeInstance(readEndpoints: ReadEndpoints) {
	return createInstance({
		now: () => 123,
		serverInfo: { enabled: () => false, read: async () => { throw new Error('Must not read'); } },
		getOnlineUsersCount: { thresholdMs: 1000, countSince: async () => 8 },
		readEndpoints,
	});
}

describe('feature endpoint transport adapters', () => {
	test('keeps legacy validation and anonymous endpoint policy around the feature', async () => {
		const feature = createInstance({
			now: () => 123,
			serverInfo: { enabled: () => false, read: async () => { throw new Error('Must not read'); } },
			getOnlineUsersCount: { thresholdMs: 1000, countSince: async () => 8 },
			readEndpoints: async () => [],
		});
		const ping = createPingEndpoint(feature);
		const onlineUsersCount = createOnlineUsersCountEndpoint(feature);
		const info = createServerInfoEndpoint(feature);
		expect(await ping.exec({}, null, null)).toEqual({ pong: 123 });
		expect(await onlineUsersCount.exec({}, null, null)).toEqual({ count: 8 });
		expect((await info.exec({}, null, null)).machine).toBe('?');
		for (const endpoint of [ping, onlineUsersCount, info]) {
			for (const invalid of [null, [], 'invalid']) {
				await expect(endpoint.exec(invalid, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
			}
		}
		expect(pingMeta.requireCredential).toBe(false);
		expect(serverInfoMeta).toMatchObject({ requireCredential: false, allowGet: true, cacheSec: 60 });
		expect(onlineUsersCountMeta).toMatchObject({ requireCredential: false, allowGet: true, cacheSec: 60 });
	});

	test('online count endpoint validates before touching its dependency', async () => {
		let calls = 0;
		const feature = createInstance({
			serverInfo: { enabled: () => false, read: async () => { throw new Error('Must not read'); } },
			getOnlineUsersCount: { thresholdMs: 1000, countSince: async () => { calls++; return 1; } },
			readEndpoints: async () => [],
		});
		const endpoint = createOnlineUsersCountEndpoint(feature);
		for (const invalid of [null, [], 'invalid']) await expect(endpoint.exec(invalid, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
		expect(calls).toBe(0);
	});

	test('endpoint introspection validates before reading and preserves descriptor order and values', async () => {
		const registry: EndpointDescriptor[] = [
			{ name: 'first/endpoint', properties: { alpha: { type: 'boolean' }, beta: { type: 'array' }, fallback: {} } },
			{ name: 'second/endpoint', properties: { id: { type: 'string' } } },
		];
		const snapshot = structuredClone(registry);
		let reads = 0;
		const feature = makeInstance(async () => { reads++; return registry; });
		const endpoint = createEndpointIntrospectionEndpoint(feature);
		const endpoints = createEndpointsEndpoint(feature);

		expect(reads).toBe(0);
		for (const invalid of [null, [], 'invalid', {}, { endpoint: 1 }, { endpoint: null }]) {
			await expect(endpoint.exec(invalid, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
		}
		expect(reads).toBe(0);

		await expect(endpoint.exec({ endpoint: 'first/endpoint' }, null, null)).resolves.toEqual({
			params: [
				{ name: 'alpha', type: 'Boolean' },
				{ name: 'beta', type: 'Array' },
				{ name: 'fallback', type: 'string' },
			],
		});
		await expect(endpoint.exec({ endpoint: 'missing' }, null, null)).resolves.toBeNull();
		await expect(endpoints.exec({}, null, null)).resolves.toEqual(['first/endpoint', 'second/endpoint']);
		expect(reads).toBe(3);
		expect(registry).toEqual(snapshot);
		expect(endpointMeta).toMatchObject({ requireCredential: false, tags: ['meta'] });
		expect(endpointMeta).not.toHaveProperty('allowGet');
		expect(endpointMeta).not.toHaveProperty('cacheSec');
		expect(endpointsMeta).toMatchObject({ requireCredential: false, tags: ['meta'] });
		expect(endpointsMeta).not.toHaveProperty('allowGet');
		expect(endpointsMeta).not.toHaveProperty('cacheSec');
	});

	test('endpoint registry failures propagate from both introspection routes', async () => {
		const error = new Error('registry unavailable');
		const feature = makeInstance(async () => { throw error; });
		const endpoint = createEndpointIntrospectionEndpoint(feature);
		const endpoints = createEndpointsEndpoint(feature);

		await expect(endpoint.exec({ endpoint: 'ping' }, null, null)).rejects.toBe(error);
		await expect(endpoints.exec({}, null, null)).rejects.toBe(error);
	});
});

test('statistics has its own feature binding and retains anonymous POST-only policy', async () => {
	const feature = createStatistics({
		readNotes: async () => ({ local: 2, remote: 3 }),
		readUsers: async () => ({ local: 5, remote: 7 }),
		countReactions: async () => 11,
		countInstances: async () => 13,
	});
	await expect(createStatsEndpoint(feature).exec({}, null, null)).resolves.toEqual({
		notesCount: 5, originalNotesCount: 2, usersCount: 12, originalUsersCount: 5,
		reactionsCount: 11, instances: 13, driveUsageLocal: 0, driveUsageRemote: 0,
	});
	expect(statsMeta.requireCredential).toBe(false);
	expect(statsMeta).not.toHaveProperty('allowGet');
	expect(statsMeta).not.toHaveProperty('cacheSec');
});

test('decoration visibility uses authenticated transport context, not request fields', async () => {
	let reads = 0;
	const decorations = createAvatarDecorations({
		readDecorations: async () => {
			reads++;
			return [{ id: 'a', name: 'A', description: '', url: '/a.png', roleIdsThatCanBeUsedThisDecoration: ['public', 'private', 'missing'], category: null }];
		},
		readRoles: async () => [{ id: 'public', isPublic: true }, { id: 'private', isPublic: false }],
	});
	const endpoint = createDecorationsEndpoint(decorations);
	await expect(endpoint.exec(null, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
	expect(reads).toBe(0);
	const [anonymous, authenticated, again] = await Promise.all([
		endpoint.exec({ authenticated: true, context: { authenticated: true } }, null, null),
		endpoint.exec({ authenticated: false }, { id: 'local-user' } as MiLocalUser, null),
		endpoint.exec({}, null, null),
	]);
	expect(anonymous[0].roleIdsThatCanBeUsedThisDecoration).toEqual(['public']);
	expect(authenticated[0].roleIdsThatCanBeUsedThisDecoration).toEqual(['public', 'private']);
	expect(again[0].roleIdsThatCanBeUsedThisDecoration).toEqual(['public']);
	expect(reads).toBe(3);
	expect(decorationsMeta).toMatchObject({ tags: ['users'], requireCredential: false });
	expect(decorationsMeta).not.toHaveProperty('allowGet');
	expect(decorationsMeta).not.toHaveProperty('cacheSec');
});

test('emoji adapters retain lookup validation, local results and cache policy', async () => {
	const names: string[] = [];
	const simple = { aliases: ['alias'], name: 'sample', category: null, url: '/sample.webp' };
	const detailed = { ...simple, id: 'e', host: null, license: null, isSensitive: false, localOnly: false, roleIdsThatCanBeUsedThisEmojiAsReaction: [] };
	const feature = createEmojis({
		listLocal: async () => [simple],
		findLocal: async name => { names.push(name); return detailed; },
	});
	const single = createEmojiEndpoint(feature);
	for (const invalid of [null, {}, { name: 1 }, { name: null }]) {
		await expect(single.exec(invalid, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
	}
	expect(names).toEqual([]);
	await expect(single.exec({ name: 'sample' }, null, null)).resolves.toEqual(detailed);
	expect(names).toEqual(['sample']);
	await expect(createEmojisEndpoint(feature).exec({}, null, null)).resolves.toEqual({ emojis: [simple] });
	for (const meta of [emojiMeta, emojisMeta]) expect(meta).toMatchObject({ requireCredential: false, allowGet: true, cacheSec: 3600, tags: ['meta'] });
});
