/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { createInstance } from '@features/instance/backend';
import { createEndpoint as createPingEndpoint, meta as pingMeta } from './endpoints/ping.js';
import { createEndpoint as createOnlineUsersCountEndpoint, meta as onlineUsersCountMeta } from './endpoints/get-online-users-count.js';
import { createEndpoint as createServerInfoEndpoint, meta as serverInfoMeta } from './endpoints/server-info.js';

describe('feature endpoint transport adapters', () => {
	test('keeps legacy validation and anonymous endpoint policy around the feature', async () => {
		const feature = createInstance({
			now: () => 123,
			serverInfo: { enabled: () => false, read: async () => { throw new Error('Must not read'); } },
			getOnlineUsersCount: { thresholdMs: 1000, countSince: async () => 8 },
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
		});
		const endpoint = createOnlineUsersCountEndpoint(feature);
		for (const invalid of [null, [], 'invalid']) await expect(endpoint.exec(invalid, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
		expect(calls).toBe(0);
	});
});
