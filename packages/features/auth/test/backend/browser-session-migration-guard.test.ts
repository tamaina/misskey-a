/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { DataSource, DataSourceOptions, QueryRunner } from 'typeorm';
import { afterEach, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { assertFixtureEnvironment, assertFixtureTarget, verifyBrowserSessionMigration } from './browser-session-migration.mjs';

const options: DataSourceOptions = { type: 'postgres', host: '127.0.0.1', port: 54312, database: 'test-misskey', synchronize: false, dropSchema: false };

afterEach(() => vi.unstubAllEnvs());

function fixture(populated = false) {
	vi.stubEnv('CI', 'true');
	vi.stubEnv('MISSKEY_CONFIG_YML', 'test.yml');
	const source = mockDeep<DataSource>({ options });
	const runner = mockDeep<QueryRunner>({ isTransactionActive: false });
	source.initialize.mockResolvedValue(source);
	source.createQueryRunner.mockReturnValue(runner);
	runner.hasTable.mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
	runner.startTransaction.mockImplementation(async () => { Reflect.set(runner, 'isTransactionActive', true); });
	runner.commitTransaction.mockImplementation(async () => { Reflect.set(runner, 'isTransactionActive', false); });
	runner.query.mockImplementation(async sql => sql.startsWith('SELECT current_database') ? [{ database: 'test-misskey' }] : sql.startsWith('SELECT 1') ? (populated ? [{ row: 1 }] : []) : []);
	const builder = mockDeep<ReturnType<DataSource['driver']['createSchemaBuilder']>>();
	builder.log.mockResolvedValue({ upQueries: [], downQueries: [] });
	source.driver.createSchemaBuilder.mockReturnValue(builder);
	return { source, runner, builder };
}

test('requires CI and explicit test configuration before any database connection', () => {
	for (const environment of [{}, { CI: 'true' }, { CI: 'false', MISSKEY_CONFIG_YML: 'test.yml' }, { CI: 'true', MISSKEY_CONFIG_YML: 'default.yml' }]) {
		expect(() => assertFixtureEnvironment(environment)).toThrow();
	}
	expect(() => assertFixtureEnvironment({ CI: 'true', MISSKEY_CONFIG_YML: 'test.yml' })).not.toThrow();
});

test('requires the exact disposable loopback database and disables automatic schema mutation', () => {
	for (const changed of [{ database: 'production' }, { host: 'db.example.test' }, { port: 5432 }, { synchronize: true }, { dropSchema: true }, { url: 'postgres://example.test/test-misskey' }, { extra: { host: 'example.test' } }]) {
		expect(() => assertFixtureTarget({ ...options, ...changed })).toThrow();
	}
	expect(() => assertFixtureTarget(options)).not.toThrow();
});

test('checks the actual connected database before any table mutation', async () => {
	const { source, runner } = fixture();
	runner.query.mockResolvedValueOnce([{ database: 'production' }]);
	await expect(verifyBrowserSessionMigration(source)).rejects.toThrow('Connected database');
	expect(runner.startTransaction).not.toHaveBeenCalled();
	expect(runner.query.mock.calls.some(([sql]) => sql.includes('DROP TABLE'))).toBe(false);
	expect(source.destroy).toHaveBeenCalledOnce();
});

test('locks and refuses populated sessions before down, rolling back and releasing resources', async () => {
	const { source, runner } = fixture(true);
	await expect(verifyBrowserSessionMigration(source)).rejects.toThrow('populated');
	expect(runner.query.mock.calls.map(([sql]) => sql)).toEqual([
		'SELECT current_database() AS database', 'LOCK TABLE "browser_session" IN ACCESS EXCLUSIVE MODE', 'SELECT 1 FROM "browser_session" LIMIT 1',
	]);
	expect(runner.rollbackTransaction).toHaveBeenCalledOnce();
	expect(runner.release).toHaveBeenCalledOnce();
	expect(source.destroy).toHaveBeenCalledOnce();
});

test('executes the actual migration down/up only on an empty fixture and checks pending DDL', async () => {
	const { source, runner, builder } = fixture();
	await verifyBrowserSessionMigration(source);
	const queries = runner.query.mock.calls.map(([sql]) => sql);
	expect(queries[3]).toBe('DROP TABLE "browser_session"');
	expect(queries[4]).toContain('CREATE TABLE "browser_session"');
	expect(runner.commitTransaction).toHaveBeenCalledOnce();
	expect(builder.log).toHaveBeenCalledOnce();
});
