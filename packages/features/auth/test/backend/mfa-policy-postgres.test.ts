/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { call } from '@orpc/server';
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
import type { UserSecurityKeysRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createI2faDoneProcedure } from '../../backend/endpoints/i/2fa/done.js';
import { createI2faKeyDoneProcedure } from '../../backend/endpoints/i/2fa/key-done.js';
import { createI2faUnregisterProcedure } from '../../backend/endpoints/i/2fa/unregister.js';
import { createI2faRemoveKeyProcedure } from '../../backend/endpoints/i/2fa/remove-key.js';
import { createI2faPasswordLessProcedure } from '../../backend/endpoints/i/2fa/password-less.js';
import { createAdminUnsetMfaProcedure } from '../../backend/endpoints/admin/unset-mfa.js';
import { testContext } from './native-context.js';
import { assertMfaFactorRetained, assertPasswordRecoveryPossible } from '../../backend/mfa-policy.js';
import { PasskeyMfaPolicy1791969900000 } from '../../../../backend/migration/1791969900000-PasskeyMfaPolicy.js';

const socket = process.env.MISSKEY_AUTH_POLICY_TEST_SOCKET;
const owner = 'syntheticmfaowner';
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
	const endpoints = () => {
		const me = mockDeep<MiLocalUser>({ id: owner, isSuspended: false, isDeleted: false, movedToUri: null });
		const auth = mockDeep<Parameters<typeof createI2faDoneProcedure>[0]['userAuthService'] & Parameters<typeof createI2faKeyDoneProcedure>[0]['userAuthService']>();
		auth.validateOtp.mockResolvedValue(true);
		const webauthn = mockDeep<Parameters<typeof createI2faKeyDoneProcedure>[0]['webAuthnService']>();
		const proof = { credentialID: 'synthetic-enrolled-key', credentialPublicKey: new Uint8Array([1, 2, 3]), attestationObject: new Uint8Array(), fmt: 'none' as const, counter: 0, userVerified: true, credentialDeviceType: 'singleDevice' as const, credentialBackedUp: false };
		webauthn.verifyRegistration.mockResolvedValue(proof);
		const events = mockDeep<Parameters<typeof createI2faDoneProcedure>[0]['globalEventService']>();
		const deps = { db: source(), userProfilesRepository: profiles() as unknown as UserProfilesRepository, userSecurityKeysRepository: keys() as unknown as UserSecurityKeysRepository, userAuthService: auth, webAuthnService: webauthn, userEntityService: mockDeep<Parameters<typeof createI2faDoneProcedure>[0]['userEntityService']>(), globalEventService: events };
		const users = mockDeep<Parameters<typeof createAdminUnsetMfaProcedure>[0]['usersRepository']>(); users.findOneBy.mockResolvedValue(me);
		const context = testContext(me);
		return { auth, webauthn, proof, events,
			done: () => call(createI2faDoneProcedure(deps), { token: '123456' }, { context }),
			keyDone: () => call(createI2faKeyDoneProcedure(deps), { password: 'synthetic-password', token: 'synthetic-code', name: 'Synthetic', credential: {} }, { context }),
			unregister: () => call(createI2faUnregisterProcedure(deps), { password: 'synthetic-password', token: 'synthetic-code' }, { context }),
			remove: () => call(createI2faRemoveKeyProcedure(deps), { password: 'synthetic-password', credentialId: first }, { context }),
			passwordless: () => call(createI2faPasswordLessProcedure(deps), { value: true }, { context }),
			reset: () => call(createAdminUnsetMfaProcedure({ db: source(), usersRepository: users, roleService: mockDeep(), moderationLogService: mockDeep() }), { userId: owner }, { context }),
		};
	};
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

	test('two real TOTP completion endpoints consume one pending setup and publish once', async () => {
		await profiles().update({ userId: owner }, { twoFactorTempSecret: 'JBSWY3DPEHPK3PXP' });
		const h = endpoints(); let arrivals = 0; let release!: () => void;
		const gate = new Promise<void>(resolve => { release = resolve; });
		h.auth.validateOtp.mockImplementation(async () => { if (++arrivals === 2) release(); await gate; return true; });
		const results = await Promise.allSettled([h.done(), h.done()]);
		const winner = results.find(result => result.status === 'fulfilled');
		expect(results.map(result => result.status).sort()).toEqual(['fulfilled', 'rejected']);
		expect(winner?.status === 'fulfilled' ? winner.value.backupCodes : []).toEqual((await snapshot()).twoFactorBackupSecret);
		expect((await snapshot()).twoFactorTempSecret).toBeNull(); expect(h.events.publishMainStream).toHaveBeenCalledOnce();
	});

	test('real admin recovery invalidates a pending TOTP proof even when the active policy was already false', async () => {
		await profiles().update({ userId: owner }, { twoFactorTempSecret: 'JBSWY3DPEHPK3PXP' });
		const h = endpoints(); let release!: () => void; let entered!: () => void;
		const gate = new Promise<void>(resolve => { release = resolve; }); const reached = new Promise<void>(resolve => { entered = resolve; });
		h.auth.validateOtp.mockImplementation(async () => { entered(); await gate; return true; });
		const completing = Promise.allSettled([h.done()]);
		await reached;
		try { await h.reset(); } finally { release(); await completing; }
		expect((await completing)[0]).toMatchObject({ status: 'rejected', reason: { message: 'authentication failed' } });
		expect((await snapshot()).twoFactorEnabled).toBe(false); expect((await snapshot()).twoFactorTempSecret).toBeNull(); expect((await snapshot()).twoFactorBackupSecret).toBeNull();
	});

	test('real key enrolment cannot insert after TOTP removal commits during its external proof', async () => {
		await profiles().update({ userId: owner }, { password: bcrypt.hashSync('synthetic-password', 4), twoFactorEnabled: true, twoFactorSecret: 'synthetic-active', twoFactorTempSecret: 'synthetic-pending' });
		const h = endpoints(); let release!: () => void; let entered!: () => void;
		const gate = new Promise<void>(resolve => { release = resolve; }); const reached = new Promise<void>(resolve => { entered = resolve; });
		h.webauthn.verifyRegistration.mockImplementation(async () => { entered(); await gate; return h.proof; });
		const enrolling = Promise.allSettled([h.keyDone()]);
		await reached;
		try { await h.unregister(); } finally { release(); await enrolling; }
		expect((await enrolling)[0]).toMatchObject({ status: 'rejected', reason: { message: 'authentication failed' } });
		expect(await keys().existsBy({ id: h.proof.credentialID })).toBe(false); expect(await keys().countBy({ userId: owner })).toBe(2);
		expect((await snapshot()).twoFactorTempSecret).toBeNull(); expect((await snapshot()).twoFactorEnabled).toBe(false);
	});

	test('real last-key removal and passwordless enable share the profile lock and finish disabled', async () => {
		await profiles().update({ userId: owner }, { password: bcrypt.hashSync('synthetic-password', 4) }); await keys().delete({ id: second });
		const h = endpoints(); const blocker = source().createQueryRunner(); await blocker.connect(); await blocker.startTransaction();
		let results: PromiseSettledResult<unknown>[];
		let pending: Promise<PromiseSettledResult<unknown>[]> | undefined;
		try {
			await blocker.manager.getRepository(MiUserProfile).findOneOrFail({ where: { userId: owner }, lock: { mode: 'pessimistic_write' } });
			pending = Promise.allSettled([h.remove(), h.passwordless()]);
			await vi.waitFor(async () => {
				// The second waiter can be soft-blocked by the first waiter rather
				// than directly by our transaction. Both must be waiting on locks.
				const waits = await source().query("SELECT 1 FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock' AND cardinality(pg_blocking_pids(pid)) > 0");
				expect(waits.length).toBe(2);
			}, { timeout: 1000, interval: 10 });
			await blocker.commitTransaction();
		} finally { if (blocker.isTransactionActive) await blocker.rollbackTransaction(); await blocker.release(); if (pending) results = await pending; }
		expect(results![0].status).toBe('fulfilled'); expect(await keys().countBy({ userId: owner })).toBe(0); expect((await snapshot()).usePasswordLessLogin).toBe(false);
	});
});
