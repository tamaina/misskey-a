/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { assertTestDatabase, assertTestDatabaseName, assertTestDatabaseOptions, resetDb } from '../backend/utility/reset-db.ts';

const originalNodeEnv = process.env.NODE_ENV;
beforeEach(() => { process.env.NODE_ENV = 'test'; });
afterEach(() => {
	if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
	else process.env.NODE_ENV = originalNodeEnv;
});

function fixture(database, tables = []) {
	const queries = [];
	return {
		queries,
		db: {
			options: { type: 'postgres', database },
			query: async (sql) => {
				queries.push(sql);
				return tables;
			},
		},
	};
}

test('test database names require a complete component, including the CI name', () => {
	for (const database of ['test-misskey', 'misskey-test', 'misskey_test_worker1', 'test']) {
		assert.doesNotThrow(() => assertTestDatabaseName(database, 'fixture'));
	}
	for (const database of [undefined, null, 42, '', 'misskey', 'contest', 'latest', 'misskey-testing', 'testmisskey']) {
		assert.throws(() => assertTestDatabaseName(database, 'fixture'), /fixture: refusing.*Check the loaded config/);
	}
});

test('a test environment does not authorize resetting a non-test DataSource', async () => {
	for (const database of ['misskey', 'contest', undefined]) {
		const { db, queries } = fixture(database);
		assert.throws(() => assertTestDatabase(db), /resetDb: refusing/);
		await assert.rejects(resetDb(db), /resetDb: refusing/);
		assert.deepEqual(queries, []);
	}
});

test('a test database name does not authorize a non-test process', async () => {
	for (const environment of ['production', 'development', undefined]) {
		if (environment === undefined) delete process.env.NODE_ENV;
		else process.env.NODE_ENV = environment;
		const { db, queries } = fixture('test-misskey');
		await assert.rejects(resetDb(db), /NODE_ENV is not a test/);
		assert.deepEqual(queries, []);
	}
});

test('alternative connection options cannot override an approved test database name', async () => {
	for (const overrides of [
		{ url: 'postgres://localhost/misskey' },
		{ replication: { master: { database: 'misskey' }, slaves: [] } },
		{ extra: { database: 'misskey' } },
		{ extra: { database: undefined } },
		{ extra: { connectionString: 'postgres://localhost/misskey' } },
		{ type: 'sqlite' },
	]) {
		const { db, queries } = fixture('test-misskey');
		Object.assign(db.options, overrides);
		await assert.rejects(resetDb(db), /ambiguous database target/);
		assert.deepEqual(queries, []);
	}
	const { db, queries } = fixture('test-misskey');
	delete db.options;
	await assert.rejects(resetDb(db));
	assert.deepEqual(queries, []);
});

test('the options guard rejects before construction with dropSchema and synchronize enabled', () => {
	const { db, queries } = fixture('misskey');
	Object.assign(db.options, { dropSchema: true, synchronize: true });
	let constructed = false;
	assert.throws(() => {
		assertTestDatabaseOptions(db.options);
		constructed = true;
	}, /refusing to reset\/sync/);
	assert.equal(constructed, false);
	assert.deepEqual(queries, []);
});

test('the configured test database still clears each existing table', async () => {
	const { db, queries } = fixture('test-misskey', [{ table: 'note' }, { table: 'user' }]);
	db.options.extra = { statement_timeout: 10000 };
	await resetDb(db);
	assert.match(queries[0], /SELECT relname/);
	assert.deepEqual(queries.slice(1), ['DELETE FROM "note" CASCADE', 'DELETE FROM "user" CASCADE']);
});

test('an empty test database performs no deletes', async () => {
	const { db, queries } = fixture('test-misskey');
	await resetDb(db);
	assert.equal(queries.length, 1);
	assert.match(queries[0], /SELECT relname/);
});
