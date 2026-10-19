/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { afterEach, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { DataSource, EntityManager, Repository } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiBrowserSession } from '../../backend/models/BrowserSession.js';
import { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';
import { SudoService, sudoPolicyStamp } from '../../backend/sudo.js';
import type { FreshPasskeyReauthentication } from '../../backend/fresh-passkey-reauthentication.js';
import type { TotpService } from '../../backend/services/TotpService.js';

const identity = { userId: 'synthetic-user', browserSession: { id: 'synthetic-session', userId: 'synthetic-user' } };

function fixture() {
	const db = mockDeep<DataSource>();
	const manager = mockDeep<EntityManager>();
	const user = mockDeep<MiUser>({ id: identity.userId, token: 'synthetic-native', host: null, isDeleted: false, isSuspended: false });
	const profile = mockDeep<MiUserProfile>({ userId: identity.userId, password: bcrypt.hashSync('password', 4),
		twoFactorEnabled: false, twoFactorSecret: null, passkeyMfaEnabled: false, usePasswordLessLogin: false, passwordLoginDisabled: false });
	const session: MiBrowserSession = mockDeep<MiBrowserSession>({ ...identity.browserSession, revokedAt: null, sudoUntil: null, sudoPolicyStamp: null, sudoGrantId: null });
	const users = mockDeep<Repository<MiUser>>();
	const profiles = mockDeep<Repository<MiUserProfile>>();
	const sessions = mockDeep<Repository<MiBrowserSession>>();
	const keys = mockDeep<Repository<MiUserSecurityKey>>();
	manager.getRepository.mockImplementation(model => {
		if (model === MiUser) return users as unknown as ReturnType<EntityManager['getRepository']>;
		if (model === MiUserProfile) return profiles as unknown as ReturnType<EntityManager['getRepository']>;
		if (model === MiBrowserSession) return sessions as unknown as ReturnType<EntityManager['getRepository']>;
		if (model === MiUserSecurityKey) return keys as unknown as ReturnType<EntityManager['getRepository']>;
		throw new Error('Unexpected repository');
	});
	db.getRepository.mockImplementation(manager.getRepository);
	users.findOneOrFail.mockResolvedValue(user); users.findOneByOrFail.mockResolvedValue(user);
	profiles.findOneOrFail.mockResolvedValue(profile); profiles.findOneByOrFail.mockResolvedValue(profile);
	sessions.findOne.mockResolvedValue(session); keys.findBy.mockResolvedValue([]);
	sessions.update.mockImplementation(async (_where, patch) => { Object.assign(session, patch); return { affected: 1, generatedMaps: [], raw: [] }; });
	// A failed transaction never leaves an elevation behind in this fixture.
	db.transaction.mockImplementation(async (...args) => {
		const callback = args.at(-1);
		if (typeof callback !== 'function') throw new Error('Unexpected overload');
		const before = { sudoUntil: session.sudoUntil, sudoPolicyStamp: session.sudoPolicyStamp, sudoGrantId: session.sudoGrantId };
		try { return await callback(manager); } catch (error) { Object.assign(session, before); throw error; }
	});
	const fresh = mockDeep<FreshPasskeyReauthentication>();
	const totp = mockDeep<TotpService>();
	const service = new SudoService(db, fresh, totp);
	return { service, db, manager, user, profile, session, users, profiles, sessions, keys, totp, fresh };
}

afterEach(() => vi.restoreAllMocks());

test('one server-owned session can repeat operations during five minutes without renewal', async () => {
	const f = fixture(); vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
	expect(await f.service.status(identity)).toEqual({ active: false, expiresAt: null });
	const elevation = await f.service.begin(identity, 'password');
	expect(elevation).toEqual({ status: 'elevated', expiresAt: new Date(Date.now() + 300_000).toISOString(), grantId: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/) });
	const deadline = f.session.sudoUntil;
	for (let index = 0; index < 2; index++) expect(await f.service.transaction(identity, async () => 'saved')).toBe('saved');
	expect(f.session.sudoUntil).toBe(deadline);
	expect(f.sessions.update).toHaveBeenCalledTimes(1);
	expect(f.manager.getRepository.mock.calls.slice(-4).map(([model]) => model)).toEqual([MiUser, MiUserProfile, MiBrowserSession, MiUserSecurityKey]);
});

test.each([
	{ userId: identity.userId },
	{ ...identity, browserSession: { ...identity.browserSession, userId: 'other' } },
	{ ...identity, accessToken: {} },
])('legacy, other-owner and app tokens cannot elevate (%j)', async invalid => {
	const f = fixture(); await expect(f.service.begin(invalid, 'password')).rejects.toThrow();
	expect(f.db.getRepository).not.toHaveBeenCalled();
});

test('wrong password and missing required MFA do not grant elevation', async () => {
	const f = fixture(); await expect(f.service.begin(identity, 'incorrect')).rejects.toThrow();
	f.profile.passkeyMfaEnabled = true;
	await expect(f.service.begin(identity, 'password')).rejects.toThrow();
	await expect(f.service.begin(identity, 'password', '123456')).rejects.toThrow();
	expect(f.totp.twoFactorAuthenticate).not.toHaveBeenCalled();
	expect(f.sessions.update).not.toHaveBeenCalled();
});

test('independent passkey MFA accepts a consumed recovery code but never an ordinary OTP', async () => {
	const f = fixture(); f.profile.passkeyMfaEnabled = true; f.profile.twoFactorBackupSecret = ['synthetic-backup'];
	await f.service.begin(identity, 'password', 'synthetic-backup');
	expect(f.totp.twoFactorAuthenticate).toHaveBeenCalledExactlyOnceWith(f.profile, 'synthetic-backup');
	expect((await f.service.status(identity)).active).toBe(true);
});

test('revocation, policy change and exact deadline reject the next operation', async () => {
	const f = fixture(); const now = vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
	await f.service.begin(identity, 'password');
	f.user.token = 'changed';
	await expect(f.service.transaction(identity, async () => 'write')).rejects.toThrow();
	f.user.token = 'synthetic-native';
	now.mockReturnValue(f.session.sudoUntil!.getTime());
	await expect(f.service.transaction(identity, async () => 'write')).rejects.toThrow();
	now.mockReturnValue(1_800_000_000_000);
	f.sessions.findOne.mockResolvedValue(null);
	await expect(f.service.transaction(identity, async () => 'write')).rejects.toThrow();
});

test('expiry while a mutation waits aborts the enclosing transaction', async () => {
	const f = fixture(); const now = vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
	await f.service.begin(identity, 'password');
	await expect(f.service.transaction(identity, async () => { now.mockReturnValue(1_800_000_300_000); return 'queued-write'; })).rejects.toThrow();
});

test('same-millisecond reauthentication has a distinct grant; stale cleanup cannot erase it', async () => {
	const f = fixture(); vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
	const first = await f.service.begin(identity, 'password'); const second = await f.service.begin(identity, 'password');
	if (first.status !== 'elevated' || second.status !== 'elevated') throw new Error('Expected elevations');
	expect(first.expiresAt).toBe(second.expiresAt); expect(first.grantId).not.toBe(second.grantId);
	await f.service.exit(identity, first.expiresAt, first.grantId); expect((await f.service.status(identity)).active).toBe(true);
	await f.service.exit(identity, second.expiresAt, second.grantId);
	expect(f.session.sudoUntil).toBeNull(); expect(f.session.sudoPolicyStamp).toBeNull(); expect(f.session.sudoGrantId).toBeNull();
});

test('a forged future deadline and a changed credential set cannot authorize an operation', async () => {
	const f = fixture(); vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000); f.session.sudoUntil = new Date(Date.now() + 300_001);
	f.session.sudoPolicyStamp = sudoPolicyStamp(f.user, f.profile, []);
	await expect(f.service.transaction(identity, async () => 'write')).rejects.toThrow();
	f.session.sudoUntil = new Date(Date.now() + 10_000);
	f.keys.findBy.mockResolvedValue([mockDeep<MiUserSecurityKey>({ id: 'AQID', userId: f.user.id, publicKey: 'AQID' })]);
	await expect(f.service.transaction(identity, async () => 'write')).rejects.toThrow();
});
