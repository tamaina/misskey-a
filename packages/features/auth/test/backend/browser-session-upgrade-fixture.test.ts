/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { DataSource, DataSourceOptions } from 'typeorm';
import { afterEach, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { assertUpgradeFixtureEnvironment, verifyBrowserSessionUpgrade } from './browser-session-upgrade-fixture.mjs';

const environment = { NODE_ENV: 'production', MISSKEY_CONFIG_YML: 'test.yml', MISSKEY_AUTH_UPGRADE_FIXTURE: '1' };
const options: DataSourceOptions = { type: 'postgres', host: '127.0.0.1', port: 54312, database: 'test-misskey', synchronize: false, dropSchema: false, migrationsRun: false, extra: {} };

afterEach(() => vi.unstubAllEnvs());

test('requires explicit upgrade opt-in and test configuration without impersonating CI', () => {
	for (const changed of [{ NODE_ENV: 'test' }, { MISSKEY_CONFIG_YML: 'default.yml' }, { MISSKEY_AUTH_UPGRADE_FIXTURE: '' }]) {
		expect(() => assertUpgradeFixtureEnvironment({ ...environment, ...changed })).toThrow();
	}
	expect(() => assertUpgradeFixtureEnvironment(environment)).not.toThrow();
});

test('rejects non-fixture targets before opening a connection', async () => {
	for (const [name, value] of Object.entries(environment)) vi.stubEnv(name, value);
	const source = mockDeep<DataSource>({ options: { ...options, host: 'production.example.test' } });
	await expect(verifyBrowserSessionUpgrade(source)).rejects.toThrow('loopback');
	expect(source.initialize).not.toHaveBeenCalled();
	expect(source.runMigrations).not.toHaveBeenCalled();
});

test('refuses automatic migrations before initialization or the empty-database check', async () => {
	for (const [name, value] of Object.entries(environment)) vi.stubEnv(name, value);
	const source = mockDeep<DataSource>({ options: { ...options, migrationsRun: true } });
	await expect(verifyBrowserSessionUpgrade(source)).rejects.toThrow('Automatic migrations');
	expect(source.initialize).not.toHaveBeenCalled();
	expect(source.runMigrations).not.toHaveBeenCalled();
	expect(source.query).not.toHaveBeenCalled();
});

test('refuses a populated fixture before migrations or writes and closes its connection', async () => {
	for (const [name, value] of Object.entries(environment)) vi.stubEnv(name, value);
	const source = mockDeep<DataSource>({ options, isInitialized: true });
	source.initialize.mockResolvedValue(source);
	source.query.mockImplementation(async sql => sql.startsWith('SELECT current_database') ? [{ database: 'test-misskey' }] : [{ tablename: 'user' }]);
	await expect(verifyBrowserSessionUpgrade(source)).rejects.toThrow('nonempty fixture');
	expect(source.runMigrations).not.toHaveBeenCalled();
	expect(source.query.mock.calls.every(([sql]) => sql.startsWith('SELECT '))).toBe(true);
	expect(source.destroy).toHaveBeenCalledOnce();
});
