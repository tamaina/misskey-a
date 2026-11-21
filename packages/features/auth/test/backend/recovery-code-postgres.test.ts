/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { userInfo } from 'node:os';
import { DataSource, EntitySchema } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { TotpService } from '../../backend/services/TotpService.js';
import type { MiUserProfile, UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';

const socket = process.env.MISSKEY_AUTH_RECOVERY_TEST_SOCKET;
const first = 'SYNTHETIC'.padEnd(32, 'A');
const second = 'SYNTHETIC'.padEnd(32, 'B');
const third = 'SYNTHETIC'.padEnd(32, 'C');
// Only the production columns used by the repository UPDATE are represented.
// This fixture tests actual TypeORM SQL on a task-owned PostgreSQL database.
const entity = new EntitySchema<Pick<MiUserProfile, 'userId' | 'password' | 'twoFactorEnabled' | 'passkeyMfaEnabled' | 'twoFactorSecret' | 'twoFactorBackupSecret'>>({
	name: 'RecoveryProfile', tableName: 'user_profile', columns: {
		userId: { type: 'varchar', primary: true },
		password: { type: 'varchar', nullable: true },
		twoFactorEnabled: { type: 'boolean', default: false },
		passkeyMfaEnabled: { type: 'boolean', default: false },
		twoFactorSecret: { type: 'varchar', nullable: true },
		twoFactorBackupSecret: { type: 'varchar', array: true, nullable: true },
	},
});

describe.skipIf(!socket)('real PostgreSQL recovery-code consumption', () => {
	let db: DataSource | undefined;
	let profiles: UserProfilesRepository;
	let service: TotpService;
	beforeAll(async () => {
		if (!socket || !isAbsolute(socket) || !dirname(socket).startsWith('/tmp/misskey-auth-recovery-') || readFileSync(join(dirname(socket), '.misskey-auth-recovery-fixture'), 'utf8') !== 'auth_recovery_synthetic') throw new Error('Task-owned fixture required');
		db = new DataSource({ type: 'postgres', host: socket, port: 55437, username: userInfo().username, database: 'auth_recovery_synthetic', entities: [entity], synchronize: true, extra: { max: 4 } });
		await db.initialize();
		profiles = db.getRepository(entity) as unknown as UserProfilesRepository;
		service = new TotpService(mockDeep<ConstructorParameters<typeof TotpService>[0]>(), mockDeep<ConstructorParameters<typeof TotpService>[1]>(), profiles);
	});
	afterAll(async () => { if (db?.isInitialized) await db.destroy(); });
	beforeEach(async () => {
		await profiles.clear();
		await profiles.insert({ userId: 'synthetic', password: 'synthetic-hash', twoFactorEnabled: true, twoFactorSecret: 'synthetic-secret', twoFactorBackupSecret: [first, second, third] });
	});
	const snapshot = () => profiles.findOneByOrFail({ userId: 'synthetic' });

	test('concurrent use of the same stale snapshot authorizes exactly once', async () => {
		const profile = await snapshot();
		const results = await Promise.allSettled([service.twoFactorAuthenticate(profile, first), service.twoFactorAuthenticate(profile, first)]);
		expect(results.map(result => result.status).sort()).toEqual(['fulfilled', 'rejected']);
		expect((await snapshot()).twoFactorBackupSecret).toEqual([second, third]);
		await expect(service.twoFactorAuthenticate(profile, first)).rejects.toThrow('authentication failed');
	});

	test('different concurrent codes both consume without restoring either', async () => {
		const profile = await snapshot();
		await Promise.all([service.twoFactorAuthenticate(profile, first), service.twoFactorAuthenticate(profile, second)]);
		expect((await snapshot()).twoFactorBackupSecret).toEqual([third]);
	});

	test.each(['password', 'twoFactorSecret', 'twoFactorEnabled', 'passkeyMfaEnabled'] as const)('changed %s rejects the old proof without consuming it', async field => {
		const profile = await snapshot();
		await profiles.update({ userId: 'synthetic' }, field === 'twoFactorEnabled' ? { twoFactorEnabled: false } : field === 'passkeyMfaEnabled' ? { passkeyMfaEnabled: true } : { [field]: 'changed-synthetic' });
		await expect(service.twoFactorAuthenticate(profile, first)).rejects.toThrow('authentication failed');
		expect((await snapshot()).twoFactorBackupSecret).toEqual([first, second, third]);
	});

	test('cleared recovery codes reject a previously loaded snapshot', async () => {
		const profile = await snapshot();
		await profiles.update({ userId: 'synthetic' }, { twoFactorBackupSecret: null });
		await expect(service.twoFactorAuthenticate(profile, first)).rejects.toThrow('authentication failed');
		expect((await snapshot()).twoFactorBackupSecret).toBeNull();
	});

	test('another user cannot consume this user code', async () => {
		const profile = await snapshot();
		await expect(service.twoFactorAuthenticate({ ...profile, userId: 'other-synthetic' }, first)).rejects.toThrow('authentication failed');
		expect((await snapshot()).twoFactorBackupSecret).toEqual([first, second, third]);
	});

	test('nullable policy fields and duplicate codes preserve existing removal semantics', async () => {
		await profiles.update({ userId: 'synthetic' }, { password: null, twoFactorSecret: null, twoFactorEnabled: false, twoFactorBackupSecret: [first, first, second] });
		await service.twoFactorAuthenticate(await snapshot(), first);
		expect((await snapshot()).twoFactorBackupSecret).toEqual([second]);
	});

	test('code text is a parameter even when it contains SQL syntax', async () => {
		const literal = 'synthetic\'); DROP TABLE user_profile; --';
		await profiles.update({ userId: 'synthetic' }, { twoFactorBackupSecret: [literal, second] });
		await service.twoFactorAuthenticate(await snapshot(), literal);
		expect((await snapshot()).twoFactorBackupSecret).toEqual([second]);
	});
});
