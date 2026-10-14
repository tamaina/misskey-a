/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { userInfo } from 'node:os';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { entities } from '@features/persistence/backend/postgres.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';
import { withLockedMfaProfile } from '../../backend/locked-mfa-profile.js';
import { TotpService } from '../../backend/services/TotpService.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { assertMfaFactorRetained, assertPasswordRecoveryPossible } from '../../backend/mfa-policy.js';
import { PasskeyMfaPolicy1791969900000 } from '../../../../backend/migration/1791969900000-PasskeyMfaPolicy.js';

const socket = process.env.MISSKEY_AUTH_POLICY_TEST_SOCKET;
const owner = 'synthetic-mfa-owner';
const first = 'synthetic-key-first';
const second = 'synthetic-key-second';

describe.skipIf(!socket)('real PostgreSQL locked MFA policy', () => {
	let db: DataSource | undefined;
	const source = () => {
		if (!db?.isInitialized) throw new Error('Fixture unavailable');
		return db;
	};
	const profiles = () => source().getRepository(MiUserProfile);
	const keys = () => source().getRepository(MiUserSecurityKey);
	const snapshot = () => profiles().findOneByOrFail({ userId: owner });
	beforeAll(async () => {
		if (!socket || !isAbsolute(socket) || !dirname(socket).startsWith('/tmp/misskey-auth-policy-') || readFileSync(join(dirname(socket), '.misskey-auth-policy-fixture'), 'utf8') !== 'auth_policy_synthetic') throw new Error('Task-owned fixture required');
		// The dedicated runner always launches Vitest from the repository root.
		db = new DataSource({ type: 'postgres', host: socket, port: 55439, username: userInfo().username, database: 'auth_policy_synthetic', entities, migrations: [resolve(process.cwd(), 'packages/backend/migration/*.js')], migrationsTransactionMode: 'all', extra: { max: 4, statement_timeout: 5000 } });
		await db.initialize();
		const migrations = await db.runMigrations();
		expect(migrations.at(-1)?.name).toBe('PasskeyMfaPolicy1791969900000');
		console.log('Production migrations applied:', migrations.length);
	});
	afterAll(async () => { if (db?.isInitialized) await db.destroy(); });
	beforeEach(async () => {
		await source().getRepository(MiUser).delete({ id: owner });
		await source().getRepository(MiUser).insert({ id: owner, username: 'synthetic', usernameLower: 'synthetic', host: null });
		await profiles().insert({ userId: owner, password: 'synthetic-hash', twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupSecret: ['synthetic-recovery'], passkeyMfaEnabled: false });
		await keys().insert([first, second].map(id => ({ id, userId: owner, name: 'Synthetic', publicKey: 'synthetic-public-key', counter: 0 })));
	});

	test('default false and migration roundtrip never promote existing orphan keys', async () => {
		expect((await snapshot()).passkeyMfaEnabled).toBe(false);
		await source().transaction(async manager => {
			if (!manager.queryRunner) throw new Error('Missing migration transaction');
			const migration = new PasskeyMfaPolicy1791969900000();
			await migration.down(manager.queryRunner);
			await migration.up(manager.queryRunner);
		});
		expect((await snapshot()).passkeyMfaEnabled).toBe(false);
		expect(await keys().countBy({ userId: owner })).toBe(2);
	});

	test('rollback rejects an enabled policy without erasing it or its keys', async () => {
		await profiles().update({ userId: owner }, { passkeyMfaEnabled: true });
		await expect(source().transaction(async manager => {
			if (!manager.queryRunner) throw new Error('Missing migration transaction');
			await new PasskeyMfaPolicy1791969900000().down(manager.queryRunner);
		})).rejects.toThrow('Cannot remove enabled passkey MFA policy');
		expect((await snapshot()).passkeyMfaEnabled).toBe(true);
		expect(await keys().countBy({ userId: owner })).toBe(2);
	});

	test('rollback waits for an in-flight policy change before checking activation', async () => {
		const writer = source().createQueryRunner();
		await writer.connect(); await writer.startTransaction();
		try {
			await writer.manager.update(MiUserProfile, { userId: owner }, { passkeyMfaEnabled: true });
			const attempt = source().transaction(async manager => {
				if (!manager.queryRunner) throw new Error('Missing migration transaction');
				await new PasskeyMfaPolicy1791969900000().down(manager.queryRunner);
			});
			const rejected = expect(attempt).rejects.toThrow('Cannot remove enabled passkey MFA policy');
			await vi.waitFor(async () => {
				const waits = await source().query("SELECT 1 FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock' AND query LIKE 'LOCK TABLE %'");
				expect(waits.length).toBeGreaterThan(0);
			}, { timeout: 1000, interval: 10 });
			await writer.commitTransaction();
			await rejected;
			expect((await snapshot()).passkeyMfaEnabled).toBe(true);
		} finally { if (writer.isTransactionActive) await writer.rollbackTransaction(); await writer.release(); }
	});

	test('two concurrent deletions retain exactly one active factor and roll back the loser', async () => {
		await profiles().update({ userId: owner }, { passkeyMfaEnabled: true });
		const expected = await snapshot();
		const remove = (id: string) => withLockedMfaProfile(source(), owner, expected, async (profile, manager) => {
			await manager.delete(MiUserSecurityKey, { userId: owner, id });
			assertMfaFactorRetained(profile, await manager.count(MiUserSecurityKey, { where: { userId: owner } }));
		});
		const results = await Promise.allSettled([remove(first), remove(second)]);
		expect(results.map(result => result.status).sort()).toEqual(['fulfilled', 'rejected']);
		expect(await keys().countBy({ userId: owner })).toBe(1);
		expect((await snapshot()).twoFactorBackupSecret).toEqual(['synthetic-recovery']);
	});

	test.each(['password', 'twoFactorSecret', 'twoFactorEnabled', 'passkeyMfaEnabled'] as const)('changed %s rejects a stale management snapshot before deleting a key', async field => {
		const expected = await snapshot();
		await profiles().update({ userId: owner }, field.endsWith('Enabled') ? { [field]: true } : { [field]: 'changed-synthetic' });
		await expect(withLockedMfaProfile(source(), owner, expected, async (_profile, manager) => manager.delete(MiUserSecurityKey, { userId: owner, id: first }))).rejects.toThrow('authentication failed');
		expect(await keys().countBy({ userId: owner })).toBe(2);
	});

	test('a consumed recovery code does not deadlock or restore from a stale snapshot', async () => {
		const expected = await snapshot();
		const service = new TotpService(mockDeep(), mockDeep(), profiles() as unknown as UserProfilesRepository);
		await service.twoFactorAuthenticate(expected, 'synthetic-recovery');
		await withLockedMfaProfile(source(), owner, expected, async (_profile, manager) => {
			await manager.delete(MiUserSecurityKey, { userId: owner, id: first });
		});
		expect((await snapshot()).twoFactorBackupSecret).toEqual([]);
		expect(await keys().countBy({ userId: owner })).toBe(1);
	});

	test('independent policy change rejects recovery consumption without burning the proof', async () => {
		const expected = await snapshot();
		await profiles().update({ userId: owner }, { passkeyMfaEnabled: true });
		const service = new TotpService(mockDeep(), mockDeep(), profiles() as unknown as UserProfilesRepository);
		await expect(service.twoFactorAuthenticate(expected, 'synthetic-recovery')).rejects.toThrow('authentication failed');
		expect((await snapshot()).twoFactorBackupSecret).toEqual(['synthetic-recovery']);
	});

	test('recovery and removal serialize; the stale removal cannot mutate after reset', async () => {
		const expected = await snapshot();
		let release!: () => void; let entered!: () => void;
		const gate = new Promise<void>(resolve => { release = resolve; });
		const reached = new Promise<void>(resolve => { entered = resolve; });
		let blockerPid = 0;
		const recovering = withLockedMfaProfile(source(), owner, undefined, async (profile, manager) => {
			assertPasswordRecoveryPossible(profile);
			const [row] = await manager.query<{ pid: number }[]>('SELECT pg_backend_pid() AS pid');
			blockerPid = row.pid; entered(); await gate;
			await manager.delete(MiUserSecurityKey, { userId: owner });
			await manager.update(MiUserProfile, { userId: owner }, { password: 'changed-synthetic', twoFactorEnabled: false, passkeyMfaEnabled: false, twoFactorSecret: null, twoFactorBackupSecret: null });
		});
		await reached;
		const removing = withLockedMfaProfile(source(), owner, expected, async (_profile, manager) => manager.delete(MiUserSecurityKey, { userId: owner, id: first }));
		const rejected = expect(removing).rejects.toThrow('authentication failed');
		try {
			await vi.waitFor(async () => {
				const waits = await source().query("SELECT 1 FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock' AND $1 = ANY(pg_blocking_pids(pid))", [blockerPid]);
				expect(waits.length).toBeGreaterThan(0);
			}, { timeout: 1000, interval: 10 });
		} finally { release(); }
		await recovering; await rejected;
		expect(await keys().countBy({ userId: owner })).toBe(0);
		expect((await snapshot()).twoFactorBackupSecret).toBeNull();
	});

	test('missing password prevents all-factor recovery without changing keys or policy', async () => {
		await profiles().update({ userId: owner }, { password: null, passkeyMfaEnabled: true });
		await expect(withLockedMfaProfile(source(), owner, undefined, async (profile, manager) => {
			assertPasswordRecoveryPossible(profile);
			await manager.delete(MiUserSecurityKey, { userId: owner });
		})).rejects.toThrow('authentication failed');
		expect(await keys().countBy({ userId: owner })).toBe(2);
		expect((await snapshot()).passkeyMfaEnabled).toBe(true);
	});

	test('production entities and complete migration chain leave no pending DDL', async () => {
		const diff = await source().driver.createSchemaBuilder().log();
		expect(diff.upQueries.map(query => query.query)).toEqual([]);
		expect(diff.downQueries.map(query => query.query)).toEqual([]);
	});
});
