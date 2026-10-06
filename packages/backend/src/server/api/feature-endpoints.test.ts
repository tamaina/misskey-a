/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { createInstance } from '@features/instance/backend';
import type { EndpointDescriptor, ReadEndpoints } from '@features/instance/backend';
import { createEndpoint as createPingEndpoint, meta as pingMeta } from './endpoints/ping.js';
import { createEndpoint as createOnlineUsersCountEndpoint, meta as onlineUsersCountMeta } from './endpoints/get-online-users-count.js';
import { createEndpoint as createServerInfoEndpoint, meta as serverInfoMeta } from './endpoints/server-info.js';
import { createEndpoint as createEndpointIntrospectionEndpoint, meta as endpointMeta } from './endpoints/endpoint.js';
import { createEndpoint as createEndpointsEndpoint, meta as endpointsMeta } from './endpoints/endpoints.js';

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
