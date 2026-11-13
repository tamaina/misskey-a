/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { BrowserSession1791849600000 } from '../../../../backend/migration/1791849600000-BrowserSession.js';

/** @param {Record<string, string | undefined>} environment */
export function assertFixtureEnvironment(environment) {
	assert.equal(environment.CI, 'true', 'Migration round trip is restricted to CI.');
	assert.equal(environment.MISSKEY_CONFIG_YML, 'test.yml', 'Explicit test.yml is required.');
}

/** @param {import('typeorm').DataSourceOptions} options */
export function assertFixtureTarget(options) {
	assert.equal(options.type, 'postgres', 'Only the disposable PostgreSQL fixture is supported.');
	assert.equal(options.database, 'test-misskey', 'Refusing a database other than test-misskey.');
	assert.equal('host' in options && options.host, '127.0.0.1', 'Only the loopback fixture is allowed.');
	assert.equal('port' in options && options.port, 54312, 'Only the test fixture port is allowed.');
	assert.equal(Boolean(options.synchronize || options.dropSchema), false, 'Automatic schema mutation must be disabled.');
	assert.equal(Boolean('replication' in options && options.replication), false, 'Replication targets are not supported.');
	assert.equal(Boolean('url' in options && options.url), false, 'Connection URLs are not supported.');
	assert.equal(Object.keys(options.extra ?? {}).length, 0, 'Connection overrides are not supported.');
}

/** @param {import('typeorm').DataSource} source */
export async function verifyBrowserSessionMigration(source) {
	assertFixtureEnvironment(process.env);
	assertFixtureTarget(source.options);
	await source.initialize();
	const runner = source.createQueryRunner();
	try {
		await runner.connect();
		const target = await runner.query('SELECT current_database() AS database');
		assert.equal(target[0]?.database, 'test-misskey', 'Connected database must be the disposable fixture.');
		assert.equal(await runner.hasTable('browser_session'), true, 'Standard migrations must run first.');
		await runner.startTransaction();
		// Lock before the emptiness check so no concurrent insert can be discarded.
		await runner.query('LOCK TABLE "browser_session" IN ACCESS EXCLUSIVE MODE');
		assert.equal((await runner.query('SELECT 1 FROM "browser_session" LIMIT 1')).length, 0, 'Refusing to drop a populated browser_session table.');
		const migration = new BrowserSession1791849600000();
		await migration.down(runner);
		assert.equal(await runner.hasTable('browser_session'), false, 'down must remove the table.');
		await migration.up(runner);
		assert.equal(await runner.hasTable('browser_session'), true, 'up must restore the table.');
		await runner.commitTransaction();
		const pending = await source.driver.createSchemaBuilder().log();
		assert.equal(pending.upQueries.length, 0, 'No pending up DDL is allowed after the round trip.');
		assert.equal(pending.downQueries.length, 0, 'No pending down DDL is allowed after the round trip.');
		console.log('BrowserSession migration down/up and schema consistency: PASS (empty CI fixture only).');
	} catch (error) {
		if (runner.isTransactionActive) await runner.rollbackTransaction();
		throw error;
	} finally {
		await runner.release();
		await source.destroy();
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	// Refuse before loading config or opening any connection.
	assertFixtureEnvironment(process.env);
	const { default: source } = await import('../../../../backend/ormconfig.js');
	await verifyBrowserSessionMigration(source);
}
