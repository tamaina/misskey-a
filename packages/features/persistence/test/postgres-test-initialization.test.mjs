/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, test } from 'node:test';
import { load } from 'js-yaml';
import { createPostgresDataSource } from '../../../backend/built/postgres.js';

// Only load the tracked CI fixture. Never read a local config or call initialize().
const ciConfig = load(readFileSync(new URL('../../../../.github/misskey/test.yml', import.meta.url), 'utf8'));
const originalNodeEnv = process.env.NODE_ENV;
beforeEach(() => { process.env.NODE_ENV = 'test'; });
afterEach(() => {
	if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
	else process.env.NODE_ENV = originalNodeEnv;
});

test('the app rejects non-test database names before returning a destructive DataSource', () => {
	for (const db of ['misskey', 'contest', 'latest', undefined]) {
		assert.throws(() => createPostgresDataSource({ ...ciConfig, db: { ...ciConfig.db, db } }),
			/createPostgresDataSource: refusing.*Check the loaded config/);
	}
});

test('a test name cannot hide overrides to the app DataSource target', () => {
	for (const extra of [{ database: 'misskey' }, { connectionString: 'postgres://db.invalid/misskey' }]) {
		assert.throws(() => createPostgresDataSource({ ...ciConfig, db: { ...ciConfig.db, extra } }),
			/createPostgresDataSource: refusing.*ambiguous database target/);
	}
	assert.throws(() => createPostgresDataSource({
		...ciConfig,
		dbReplications: true,
		dbSlaves: [{ host: 'db.invalid', port: 5432, db: 'misskey', user: 'fixture', pass: '' }],
	}), /createPostgresDataSource: refusing.*ambiguous database target/);
});

test('the tracked CI database can still be initialized by the test app', () => {
	const source = createPostgresDataSource(ciConfig);
	assert.equal(source.options.database, 'test-misskey');
	assert.equal(source.options.extra.statement_timeout, 10000);
	assert.equal(source.options.dropSchema, true);
	assert.equal(source.options.synchronize, true);
	assert.equal(source.isInitialized, false);
});

test('a non-test app keeps a non-test database and replication without destructive flags', () => {
	process.env.NODE_ENV = 'production';
	const source = createPostgresDataSource({
		...ciConfig,
		db: { ...ciConfig.db, db: 'misskey', disableCache: true },
		dbReplications: true,
		dbSlaves: [{ host: 'db.invalid', port: 5432, db: 'misskey-replica', user: 'fixture', pass: '' }],
	});
	assert.equal(source.options.database, 'misskey');
	assert.equal(source.options.replication.slaves[0].database, 'misskey-replica');
	assert.equal(source.options.dropSchema, false);
	assert.equal(source.options.synchronize, false);
	assert.equal(source.isInitialized, false);
});
