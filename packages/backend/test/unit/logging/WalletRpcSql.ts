/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import type { Config } from '@/config.js';
import type { QueryRunner } from 'typeorm';
const mocks = vi.hoisted(() => ({ write: vi.fn() }));
vi.mock('@features/runtime/backend/logging/logging-runtime.js', () => ({ logManager: { write: mocks.write } }));
import { createPostgresDataSource } from '@features/persistence/backend/postgres.js';

test('native SQL query, error and slow logs suppress all RPC-write parameters even when parameter logging is enabled', () => {
	const db = createPostgresDataSource({ db: { disableCache: true }, logging: { sql: { enableQueryParamLogging: true } } } as Config);
	const rpc = 'https://synthetic:fake@rpc.example.test/private-token';
	const runner = { data: { billingWalletRpc: true } } as QueryRunner;
	for (const log of [() => db.logger.logQuery('INSERT INTO billing_wallet_chain VALUES ($1)', [rpc], runner),
		() => db.logger.logQueryError('driver detail', 'INSERT INTO billing_wallet_chain VALUES ($1)', [rpc], runner),
		() => db.logger.logQuerySlow(1000, 'INSERT INTO billing_wallet_chain VALUES ($1)', [rpc], runner)]) log();
	expect(mocks.write).toHaveBeenCalledTimes(3);
	expect(JSON.stringify(mocks.write.mock.calls)).not.toContain(rpc);
	for (const [record] of mocks.write.mock.calls) expect(record.compatibility.data).toBeUndefined();
	db.logger.logQuery('SELECT $1', ['ordinary'], { data: {} } as QueryRunner);
	expect(mocks.write.mock.lastCall?.[0].compatibility.data).toEqual(['ordinary']);
});
