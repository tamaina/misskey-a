/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { performance } from 'node:perf_hooks';
import bcrypt from 'bcryptjs';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { DataSource, EntityManager, Repository } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiBrowserSession } from '../../backend/models/BrowserSession.js';
import { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';
import { sudoIdentity } from '../../backend/sudo.api.js';
import { SudoService, sudoPolicyStamp } from '../../backend/sudo.js';
import { SecuritySettings } from '../../backend/security-settings.js';
import type { SecuritySettingsDependencies } from '../../backend/security-settings.js';
import { nativeCredentialFingerprint, freshReauthenticationPolicyStamp } from '../../backend/fresh-passkey-reauthentication.js';
import type { FreshPasskeyReauthentication } from '../../backend/fresh-passkey-reauthentication.js';
import type { TotpService } from '../../backend/services/TotpService.js';
import type { BrowserSessionService } from '../../backend/services/BrowserSessionService.js';

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
	const browserSessions = mockDeep<Pick<BrowserSessionService, 'issue'>>();
	const service = new SudoService(db, fresh, totp, browserSessions);
	return { service, db, manager, user, profile, session, users, profiles, sessions, keys, totp, fresh, browserSessions };
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
	{ ...identity, browserSession: { ...identity.browserSession, userId: 'other' } },
	{ ...identity, accessToken: {} },
])('other-owner and app tokens cannot elevate (%j)', async invalid => {
	const f = fixture(); await expect(f.service.begin(invalid, 'password')).rejects.toThrow();
	expect(f.db.getRepository).not.toHaveBeenCalled();
	expect(f.browserSessions.issue).not.toHaveBeenCalled();
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

test('a later credential or policy change leaves an unexpired grant valid', async () => {
	const f = fixture(); vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
	await f.service.begin(identity, 'password');
	f.user.token = 'changed';
	f.profile.passkeyMfaEnabled = true;
	expect(await f.service.transaction(identity, async () => 'write')).toBe('write');
});

test('revocation and the exact deadline reject the next operation', async () => {
	const f = fixture(); const now = vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
	await f.service.begin(identity, 'password');
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

test('a forged future deadline cannot authorize an operation', async () => {
	const f = fixture(); vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000); f.session.sudoUntil = new Date(Date.now() + 300_001);
	f.session.sudoGrantId = 'g'.repeat(43);
	f.session.sudoPolicyStamp = sudoPolicyStamp(f.user, f.profile, []);
	await expect(f.service.transaction(identity, async () => 'write')).rejects.toThrow();
});

test.each([false, true])('passkey-only sudo remains available after key registration enables MFA=%s', async passkeyMfaEnabled => {
	const f = fixture(); Object.assign(f.profile, { passwordLoginDisabled: true, usePasswordLessLogin: true, passkeyMfaEnabled });
	const keys = [mockDeep<MiUserSecurityKey>({ id: 'AQID', userId: f.user.id, publicKey: 'AQID' })];
	f.keys.findBy.mockResolvedValue(keys);
	f.fresh.begin.mockResolvedValue({ ticket: 'synthetic-ticket', options: { challenge: 'AQID', userVerification: 'required' } });
	expect(await f.service.begin(identity, undefined)).toMatchObject({ status: 'passkey-required' });
	expect(f.fresh.begin).toHaveBeenCalledWith(identity, 'sudo', undefined);
});

test.each(['missing', 'expired'] as const)('passkey MFA enable rejects %s elevation through the real sudo transaction', async mode => {
	const f = fixture();
	f.keys.findBy.mockResolvedValue([mockDeep<MiUserSecurityKey>({ id: 'owned-key', userId: identity.userId })]);
	if (mode === 'expired') {
		f.session.sudoUntil = new Date(Date.now() - 1); f.session.sudoGrantId = 'expired-grant';
		f.session.sudoPolicyStamp = sudoPolicyStamp(f.user, f.profile, await f.keys.findBy({ userId: identity.userId }));
	}
	const deps = Object.assign(mockDeep<SecuritySettingsDependencies>(), { sudo: f.service });
	await expect(new SecuritySettings(deps).enablePasskeyMfa(identity, true)).rejects.toMatchObject({ code: 'SUDO_REQUIRED' });
	expect(f.profiles.update).not.toHaveBeenCalled(); expect(f.sessions.update).not.toHaveBeenCalled();
	expect(deps.events.publishMainStream).not.toHaveBeenCalled();
});

const nativeIdentity = { userId: identity.userId, nativeCredentialFingerprint: nativeCredentialFingerprint('synthetic-native') };

test('a native token issues a browser session, attaches sudo and does not rotate user.token', async () => {
	const f = fixture(); vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
	const issuedToken = `bs_${'A'.repeat(43)}`;
	const issued = { id: 'issued-session', userId: identity.userId, createdAt: new Date(), lastUsedAt: new Date(), revokedAt: null, sudoUntil: null, sudoPolicyStamp: null, sudoGrantId: null };
	f.browserSessions.issue.mockResolvedValue({ token: issuedToken, session: issued });
	f.sessions.findOne.mockImplementation(async options => !Array.isArray(options.where) && options.where?.id === 'issued-session' ? issued as typeof f.session : f.session);
	f.sessions.update.mockImplementation(async (where, patch) => {
		if (typeof where === 'object' && 'id' in where && where.id === 'issued-session') Object.assign(issued, patch);
		else Object.assign(f.session, patch);
		return { affected: 1, generatedMaps: [], raw: [] };
	});
	const elevation = await f.service.begin(nativeIdentity, 'password', undefined, false, { ip: '203.0.113.1', userAgent: 'Synthetic' });
	expect(elevation).toEqual({ status: 'elevated', expiresAt: new Date(Date.now() + 300_000).toISOString(), grantId: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/), token: issuedToken });
	expect(f.browserSessions.issue).toHaveBeenCalledExactlyOnceWith(identity.userId, f.sessions, { ip: '203.0.113.1', userAgent: 'Synthetic' });
	expect(f.user.token).toBe('synthetic-native');
	expect(issued.sudoGrantId).toEqual(expect.stringMatching(/^[A-Za-z0-9_-]{43}$/));
	expect((await f.service.status(nativeIdentity))).toEqual({ active: false, expiresAt: null });
});

test('an app token cannot start native sudo migration', async () => {
	const f = fixture();
	await expect(f.service.begin({ userId: identity.userId, accessToken: {} }, 'password')).rejects.toThrow();
	expect(f.browserSessions.issue).not.toHaveBeenCalled();
});

// The request authenticated with the old native token before the revocation transaction.
test.each([false, true])('native passkey completion respects token regeneration before issuance (rotated=%s)', async rotated => {
	const f = fixture(); f.profile.passkeyMfaEnabled = true;
	const keys = [mockDeep<MiUserSecurityKey>({ id: 'AQID', userId: identity.userId, publicKey: 'AQID' })];
	f.keys.findBy.mockResolvedValue(keys);
	f.browserSessions.issue.mockResolvedValue({ token: `bs_${'A'.repeat(43)}`, session: f.session });
	const stamp = freshReauthenticationPolicyStamp(f.profile, keys);
	f.fresh.complete.mockImplementation(async () => {
		// Proof has passed; regeneration acquires and releases the user lock first.
		if (rotated) f.user.token = 'regenerated-native';
		return { userId: identity.userId, sessionId: 'native', purpose: 'sudo', policyStamp: stamp, expiresAtMonotonic: performance.now() + 90_000 };
	});
	const completion = f.service.complete(nativeIdentity, 'ticket', {});
	if (rotated) {
		await expect(completion).rejects.toThrow();
		expect(f.browserSessions.issue).not.toHaveBeenCalled();
		expect(f.sessions.update).not.toHaveBeenCalled();
	} else {
		await expect(completion).resolves.toMatchObject({ status: 'elevated', token: `bs_${'A'.repeat(43)}` });
		expect(f.browserSessions.issue).toHaveBeenCalledOnce();
	}
	expect(f.fresh.complete).toHaveBeenCalledOnce();
});

test('elevated callbacks require a session while native read-only transactions retain null', async () => {
	const f = fixture();
	await f.service.begin(identity, 'password');
	await f.service.transaction(identity, async context => {
		expectTypeOf(context.session).toEqualTypeOf<MiBrowserSession>();
		expect(context.session.id).toBe(identity.browserSession.id);
	});
	await f.service.transaction(nativeIdentity, async context => {
		expectTypeOf(context.session).toEqualTypeOf<MiBrowserSession | null>();
		expect(context.session).toBeNull();
	}, false);
	await expect(f.service.transaction(nativeIdentity, async context => context.session.id)).rejects.toThrow();
	await expect(new SecuritySettings(Object.assign(mockDeep<SecuritySettingsDependencies>(), { sudo: f.service })).passwordlessStart(nativeIdentity)).rejects.toThrow();
});

test('native identity fingerprints the authenticated request credential, not cached user data', () => {
	const f = fixture();
	const context = mockDeep<Parameters<typeof sudoIdentity>[0]>();
	context.principal = { ...f.user, host: null, uri: null };
	context.credential = 'authenticated-native';
	context.browserSession = undefined; context.token = null;
	expect(sudoIdentity(context).nativeCredentialFingerprint).toBe(nativeCredentialFingerprint('authenticated-native'));
});
