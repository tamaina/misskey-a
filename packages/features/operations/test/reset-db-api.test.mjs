/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { createRouterClient } from '@orpc/server';
import { createOperationsRouter } from '../../../backend/built/features/operations/backend.js';

const originalNodeEnv = process.env.NODE_ENV;
beforeEach(() => { process.env.NODE_ENV = 'test'; });
afterEach(() => {
	if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
	else process.env.NODE_ENV = originalNodeEnv;
});

function fixture(database) {
	const calls = [];
	const deps = {
		db: {
			options: { type: 'postgres', database },
			query: async () => { calls.push('sql'); return []; },
		},
		redisClient: { flushdb: async () => { calls.push('redis'); } },
		loggerService: { getLogger: () => ({ info: () => {} }) },
		metaService: { fetch: async () => { calls.push('meta'); return {}; } },
		globalEventService: { publishInternalEvent: () => { calls.push('event'); } },
	};
	const context = {
		credential: null, ip: '192.0.2.1', headers: {},
		services: { authenticate: async () => [null, null], limit: async () => null },
	};
	return { calls, client: createRouterClient(createOperationsRouter(deps), { context }) };
}

test('reset-db rejects a non-test DataSource before Redis, SQL, or metadata changes', async () => {
	for (const database of ['misskey', 'contest', undefined]) {
		const { client, calls } = fixture(database);
		await assert.rejects(client.resetDb({}));
		assert.deepEqual(calls, []);
	}
});

test('reset-db still rejects a non-test environment even with a test database', async () => {
	process.env.NODE_ENV = 'production';
	const { client, calls } = fixture('test-misskey');
	await assert.rejects(client.resetDb({}));
	assert.deepEqual(calls, []);
});

test('reset-db preserves test reset and metadata refresh order', async () => {
	const { client, calls } = fixture('test-misskey');
	await client.resetDb({});
	assert.deepEqual(calls, ['redis', 'sql', 'meta', 'event']);
});
