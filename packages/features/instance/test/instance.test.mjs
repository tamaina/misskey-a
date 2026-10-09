/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'node:test';
import { createRouterClient } from '@orpc/server';
import assert from 'node:assert/strict';
import { createInstanceRouter } from '../../../backend/built/features/instance/backend.js';

test('feature construction does not read settings, metrics, or the clock', async () => {
	const calls = [];
	const feature = createInstance({
		now: () => { calls.push('clock'); return 123; },
		getOnlineUsersCount: { thresholdMs: 1000, countSince: async () => { calls.push('count'); return 0; } },
		readEndpoints: async () => { calls.push('endpoints'); return []; },
	});
	assert.deepEqual(calls, []);
	assert.deepEqual(await feature.ping({}), { pong: 123 });
	assert.deepEqual(calls, ['clock']);
	assert.equal('server-info' in feature, false);
});

test('separate role instances keep their injected dependencies independent', async () => {
	const make = now => createInstance({ now: () => now, getOnlineUsersCount: { thresholdMs: 1000, countSince: async () => 0 }, readEndpoints: async () => [] });
	const first = make(1); const second = make(2);
	assert.deepEqual(await first.ping({}), { pong: 1 });
	assert.deepEqual(await second.ping({}), { pong: 2 });
	assert.deepEqual(await first.ping({}), { pong: 1 });
});

function createInstance(deps) { return createRouterClient(createInstanceRouter({ ...deps, serverInfo: { enabled: () => false, read: async () => { throw new Error('Must not read'); } } }), { context: { credential: null, ip: '127.0.0.1', headers: {}, services: { authenticate: async () => [null, null], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null } } }); }
