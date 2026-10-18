/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { userInfo } from 'node:os';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { entities } from '@features/persistence/backend/postgres.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiBrowserSession } from '../../backend/models/BrowserSession.js';
import { MiPasswordResetRequest } from '../../backend/models/PasswordResetRequest.js';
import { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';
import { SudoService } from '../../backend/sudo.js';
import { recoverPassword } from '../../backend/password-recovery.js';
import { queueCommittedAccountDeletion } from '../../backend/account-deletion.js';
import { PasswordLoginPolicy1792300000002 } from '../../../../backend/migration/1792300000002-PasswordLoginPolicy.js';
import { DeletionIntent1792300000003 } from '../../../../backend/migration/1792300000003-DeletionIntent.js';

const socket = process.env.MISSKEY_AUTH_POLICY_TEST_SOCKET;
const owner = 'syntheticcompletion';
const identity = { userId: owner, browserSession: { id: 'synthetic-session', userId: owner } };
describe.skipIf(!socket)('security completion real PostgreSQL', () => {
	let db: DataSource;
	let sudo: SudoService;
	const events = mockDeep<Parameters<typeof recoverPassword>[0]['globalEventService']>();
	const profile = () => db.getRepository(MiUserProfile).findOneByOrFail({ userId: owner });
	beforeAll(async () => {
		if (!socket || !isAbsolute(socket) || !dirname(socket).startsWith('/tmp/misskey-auth-policy-') || readFileSync(join(dirname(socket), '.misskey-auth-policy-fixture'), 'utf8') !== 'auth_policy_synthetic') throw new Error('Task-owned fixture required');
		db = new DataSource({ type: 'postgres', host: socket, port: 55439, username: userInfo().username, database: 'auth_policy_synthetic', entities, migrations: [resolve(process.cwd(), 'packages/backend/migration/*.js')], migrationsTransactionMode: 'all', extra: { max: 4, statement_timeout: 5000 } });
		await db.initialize();
		const applied = await db.runMigrations();
		expect(applied).toHaveLength(366);
		expect(applied.at(-1)?.name).toBe('AccessTokenExpiry1792300000004');
		const schema = await db.driver.createSchemaBuilder().log();
		expect(schema.upQueries.map(query => query.query)).toEqual([]);
		console.log('Production migrations / zero pending DDL:', applied.length);
		sudo = new SudoService(db, mockDeep(), mockDeep());
	});
	afterAll(async () => { vi.restoreAllMocks(); if (db?.isInitialized) await db.destroy(); });
	beforeEach(async () => {
		vi.restoreAllMocks(); vi.clearAllMocks();
		await db.getRepository(MiUser).delete({ id: owner });
		await db.getRepository(MiUser).insert({ id: owner, username: 'synthetic', usernameLower: 'synthetic', host: null, token: 'synthetic-native' });
		await db.getRepository(MiUserProfile).insert({ userId: owner, password: bcrypt.hashSync('password', 4), twoFactorBackupSecret: ['synthetic-code'], email: 'synthetic@example.test', emailVerified: true });
		await db.getRepository(MiBrowserSession).insert({ id: identity.browserSession.id, userId: owner, tokenHash: 'x'.repeat(64), createdAt: new Date(), lastUsedAt: new Date() });
	});
	test('five-minute session elevation is repeatable, owner-bound and never renewed by mutation', async () => {
		const grant = await sudo.begin(identity, 'password');
		if (grant.status !== 'elevated') throw new Error('Expected password-only elevation');
		for (let index = 0; index < 2; index++) await sudo.transaction(identity, async ({ manager }) => manager.update(MiUserProfile, { userId: owner }, { email: 'changed@example.test' }));
		expect((await sudo.status(identity)).expiresAt).toBe(grant.expiresAt);
		await expect(sudo.transaction({ ...identity, browserSession: { id: 'different-session', userId: owner } }, async () => undefined)).rejects.toThrow();
	});
	test('expiry after writes rolls the database transaction back', async () => {
		const grant = await sudo.begin(identity, 'password');
		if (grant.status !== 'elevated') throw new Error('Expected password-only elevation');
		await expect(sudo.transaction(identity, async ({ manager }) => {
			await manager.update(MiUserProfile, { userId: owner }, { email: 'must-rollback@example.test' });
			vi.spyOn(Date, 'now').mockReturnValue(new Date(grant.expiresAt).getTime());
		})).rejects.toThrow();
		expect((await profile()).email).toBe('synthetic@example.test');
	});
	test('a revoked session cannot authorize a later mutation', async () => {
		await sudo.begin(identity, 'password');
		await db.getRepository(MiBrowserSession).update(identity.browserSession.id, { revokedAt: new Date() });
		await expect(sudo.transaction(identity, async ({ manager }) => manager.update(MiUserProfile, { userId: owner }, { email: 'forbidden@example.test' }))).rejects.toThrow();
		expect((await profile()).email).toBe('synthetic@example.test');
	});
	test('a single reset request has one winner, preserves factors and revokes credentials', async () => {
		await db.getRepository(MiUserProfile).update({ userId: owner }, { passkeyMfaEnabled: true, usePasswordLessLogin: false, passwordLoginDisabled: true });
		await db.getRepository(MiUserSecurityKey).insert({ id: 'synthetic-key', userId: owner, name: 'Synthetic', publicKey: 'synthetic', counter: 0 });
		const request = { id: 'synthetic-reset', token: 'synthetic-reset-token', issuedAt: Date.now() };
		await db.getRepository(MiPasswordResetRequest).insert({ id: request.id, token: request.token, userId: owner });
		const results = await Promise.allSettled([1, 2].map(index => recoverPassword({ db, globalEventService: events }, owner, `replacement-${index}`, request)));
		expect(results.map(result => result.status).sort()).toEqual(['fulfilled', 'rejected']);
		const current = await profile();
		expect(current.passkeyMfaEnabled).toBe(true); expect(current.twoFactorBackupSecret).toEqual(['synthetic-code']); expect(current.passwordLoginDisabled).toBe(false);
		expect(await db.getRepository(MiUserSecurityKey).countBy({ userId: owner })).toBe(1);
		expect(await db.getRepository(MiPasswordResetRequest).countBy({ userId: owner })).toBe(0);
		expect((await db.getRepository(MiBrowserSession).findOneByOrFail({ id: identity.browserSession.id })).revokedAt).not.toBeNull();
		expect((await db.getRepository(MiUser).findOneByOrFail({ id: owner })).token).not.toBe('synthetic-native');
		expect(events.publishInternalEvent).toHaveBeenCalledTimes(2);
	});
	test('expired reset is rejected without changing password or consuming its row', async () => {
		const request = { id: 'synthetic-reset', token: 'synthetic-reset-token', issuedAt: Date.now() - 30 * 60_000 };
		await db.getRepository(MiPasswordResetRequest).insert({ id: request.id, token: request.token, userId: owner });
		const before = (await profile()).password;
		await expect(recoverPassword({ db, globalEventService: events }, owner, 'forbidden', request)).rejects.toThrow();
		expect((await profile()).password).toBe(before); expect(await db.getRepository(MiPasswordResetRequest).countBy({ userId: owner })).toBe(1); expect(events.publishInternalEvent).not.toHaveBeenCalled();
	});
	test('queue failure rolls deletion intent, deleted state and session revocation back', async () => {
		await sudo.begin(identity, 'password'); const queue = mockDeep<Parameters<typeof queueCommittedAccountDeletion>[3]['queue']>();
		queue.createDeleteAccountJob.mockRejectedValue(new Error('Synthetic queue failure'));
		await expect(sudo.transaction(identity, async ({ manager, user, profile }) => queueCommittedAccountDeletion(manager, user, profile, { meta: { rootUserId: null }, queue }))).rejects.toThrow('Synthetic queue failure');
		expect((await db.getRepository(MiUser).findOneByOrFail({ id: owner })).isDeleted).toBe(false);
		const [row] = await db.query('SELECT "deletionIntentId" FROM "user_profile" WHERE "userId" = $1', [owner]); expect(row.deletionIntentId).toBeNull();
		expect((await sudo.status(identity)).active).toBe(true);
	});
	test('new policy migrations round trip and refuse to erase active policies/intents', async () => {
		await db.getRepository(MiUserProfile).update({ userId: owner }, { passwordLoginDisabled: true });
		await expect(db.transaction(manager => new PasswordLoginPolicy1792300000002().down(manager.queryRunner!))).rejects.toThrow('Restore password login explicitly');
		await db.getRepository(MiUserProfile).update({ userId: owner }, { passwordLoginDisabled: false, deletionIntentId: 'x'.repeat(43) });
		await expect(db.transaction(manager => new DeletionIntent1792300000003().down(manager.queryRunner!))).rejects.toThrow('Complete pending account deletion');
		await db.getRepository(MiUserProfile).update({ userId: owner }, { deletionIntentId: null });
		await db.transaction(async manager => {
			const deletion = new DeletionIntent1792300000003(); const password = new PasswordLoginPolicy1792300000002();
			await deletion.down(manager.queryRunner!); await password.down(manager.queryRunner!); await password.up(manager.queryRunner!); await deletion.up(manager.queryRunner!);
		});
		expect((await db.driver.createSchemaBuilder().log()).upQueries.map(query => query.query)).toEqual([]);
	});
	test('the five new migrations down/up against production metadata leave no pending DDL', async () => {
		for (let index = 0; index < 5; index++) await db.undoLastMigration();
		const applied = await db.runMigrations();
		expect(applied.map(migration => migration.name)).toEqual(['OidcIdentities1792300000000', 'SudoPolicy1792300000001', 'PasswordLoginPolicy1792300000002', 'DeletionIntent1792300000003', 'AccessTokenExpiry1792300000004']);
		expect((await db.driver.createSchemaBuilder().log()).upQueries.map(query => query.query)).toEqual([]);
	});
});
