/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readdir, rm, symlink } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { assertFixtureTarget } from './browser-session-migration.mjs';

/** @param {Record<string, string | undefined>} environment */
export function assertUpgradeFixtureEnvironment(environment) {
	assert.equal(environment.NODE_ENV, 'production', 'Production ORM metadata is required; the database must still be the disposable fixture.');
	assert.equal(environment.MISSKEY_CONFIG_YML, 'test.yml', 'Explicit test.yml is required.');
	assert.equal(environment.MISSKEY_AUTH_UPGRADE_FIXTURE, '1', 'Explicit upgrade fixture opt-in is required.');
}

/** Apply only up migrations to a fresh disposable database; never run down.
 * @param {import('typeorm').DataSource} source
 */
export async function verifyBrowserSessionUpgrade(source) {
	assertUpgradeFixtureEnvironment(process.env);
	assertFixtureTarget(source.options);
	assert.equal(Boolean(source.options.migrationsRun), false, 'Automatic migrations must be disabled before the empty-fixture check.');
	const migrationDirectory = fileURLToPath(new URL('../../../../backend/migration/', import.meta.url));
	const migrationPaths = (await readdir(migrationDirectory)).filter(name => name.endsWith('.js')).map(name => join(migrationDirectory, name));
	const sessionPath = join(migrationDirectory, '1791849600000-BrowserSession.js');
	assert.equal(migrationPaths.filter(path => path === sessionPath).length, 1);
	source.setOptions({ migrations: migrationPaths, installExtensions: false });
	let legacy;
	let serviceDirectory;
	try {
		await source.initialize();
		assert.equal((await source.query('SELECT current_database() AS database'))[0].database, 'test-misskey');
		assert.equal((await source.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")).length, 0, 'Refusing a nonempty fixture database.');
		const sessionMetadata = source.entityMetadatas.find(metadata => metadata.tableName === 'browser_session');
		assert.ok(sessionMetadata, 'The actual candidate session entity must be registered.');
		// This projection is the old ORM entity set: the session table is the
		// candidate's only entity addition. It does not boot the old application.
		legacy = new source.constructor({ ...source.options,
			entities: source.entityMetadatas.filter(metadata => metadata !== sessionMetadata).map(metadata => metadata.target),
			migrations: migrationPaths.filter(path => path !== sessionPath),
		});
		await legacy.initialize();
		const baselineMigrations = await legacy.runMigrations();
		assert.ok(baselineMigrations.length > 0);
		const ownerId = '00000000000000000000000000000001';
		const otherId = '00000000000000000000000000000002';
		for (const [id, username] of [[ownerId, 'auth_upgrade_owner'], [otherId, 'auth_upgrade_other']]) {
			await legacy.query('INSERT INTO "user" ("id", "username", "usernameLower", "token") VALUES ($1, $2, $2, $3)', [id, username, id.slice(-16)]);
		}
		const usersBefore = await legacy.query('SELECT "id", "username", "token" FROM "user" ORDER BY "id"');
		const upgrade = await source.runMigrations();
		assert.deepEqual(upgrade.map(migration => migration.name), ['BrowserSession1791849600000']);
		assert.deepEqual(await source.query('SELECT "id", "username", "token" FROM "user" ORDER BY "id"'), usersBefore);
		assert.equal(await source.showMigrations(), false);
		for (const connection of [source, legacy]) {
			const pending = await connection.driver.createSchemaBuilder().log();
			assert.equal(pending.upQueries.length, 0, 'New and legacy ORM projections must require no extra DDL.');
			assert.equal(pending.downQueries.length, 0);
		}
		// Compile the actual service into an owned temporary directory, leaving
		// both source and shared dependencies unchanged.
		serviceDirectory = await mkdtemp(join(tmpdir(), 'misskey-auth-upgrade-'));
		const backendRequire = createRequire(new URL('../../../../backend/package.json', import.meta.url));
		await mkdir(join(serviceDirectory, 'node_modules'));
		await symlink(dirname(backendRequire.resolve('typeorm')), join(serviceDirectory, 'node_modules/typeorm'), 'dir');
		const { build } = await import('esbuild');
		const serviceFile = join(serviceDirectory, 'service.mjs');
		await build({ entryPoints: [fileURLToPath(new URL('../../backend/services/BrowserSessionService.ts', import.meta.url))],
			bundle: true, platform: 'node', format: 'esm', packages: 'external', outfile: serviceFile, logLevel: 'silent' });
		const { BrowserSessionService } = await import(pathToFileURL(serviceFile).href);
		const repository = source.getRepository(sessionMetadata.target);
		const service = new BrowserSessionService(repository, { gen: () => '00000000000000000000000000000003' });
		const issued = await service.issue(ownerId);
		assert.match(issued.token, /^bs_[A-Za-z0-9_-]{43}$/);
		const visible = await repository.findOneByOrFail({ id: issued.session.id });
		assert.equal(visible.tokenHash, undefined, 'Ordinary entity selection must hide the credential hash.');
		const stored = await repository.createQueryBuilder('session').addSelect('session.tokenHash')
			.where('session.id = :id', { id: issued.session.id }).getOneOrFail();
		assert.equal(stored.tokenHash, createHash('sha256').update(issued.token).digest('hex'));
		assert.equal(stored.sudoUntil, null);
		assert.equal((await service.verify(issued.token))?.userId, ownerId);
		assert.equal(await service.isActive(issued.session.id, ownerId), true);
		assert.equal(await service.isActive(issued.session.id, otherId), false);
		assert.equal(await service.revokeOwned(otherId, issued.session.id), false);
		assert.equal((await service.verify(issued.token))?.userId, ownerId);
		assert.equal(await service.revokeOwned(ownerId, issued.session.id), true);
		assert.equal(await service.verify(issued.token), null);
		assert.equal(await service.isActive(issued.session.id, ownerId), false);
		assert.equal(await repository.count(), 1, 'Revocation retains the session record.');
		assert.deepEqual(await legacy.query('SELECT "id", "username", "token" FROM "user" ORDER BY "id"'), usersBefore);
		console.log('BrowserSession up-only upgrade: baseline migrations, retained legacy data, new/old ORM schema, hash-only issuance, ownership and revocation PASS.');
	} finally {
		try {
			if (legacy?.isInitialized) await legacy.destroy();
		} finally {
			try {
				if (source.isInitialized) await source.destroy();
			} finally {
				if (serviceDirectory) await rm(serviceDirectory, { recursive: true, force: true });
			}
		}
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	assertUpgradeFixtureEnvironment(process.env);
	const { default: source } = await import('../../../../backend/ormconfig.js');
	await verifyBrowserSessionUpgrade(source);
}
