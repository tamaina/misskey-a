/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { call } from '@orpc/server';
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { DataSource, EntityManager } from 'typeorm';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import type { UserProfilesRepository, UserSecurityKeysRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';
import { createI2faRegisterProcedure } from '../../backend/endpoints/i/2fa/register.js';
import { createI2faDoneProcedure } from '../../backend/endpoints/i/2fa/done.js';
import { createI2faRegisterKeyProcedure } from '../../backend/endpoints/i/2fa/register-key.js';
import { createI2faKeyDoneProcedure } from '../../backend/endpoints/i/2fa/key-done.js';
import { createI2faPasswordLessProcedure } from '../../backend/endpoints/i/2fa/password-less.js';
import { createI2faUpdateKeyProcedure } from '../../backend/endpoints/i/2fa/update-key.js';
import { testContext } from './native-context.js';

function fixture() {
	const me = mockDeep<MiLocalUser>({ id: 'synthetic-user', username: 'synthetic', isSuspended: false, isDeleted: false, movedToUri: null });
	const profile = mockDeep<MiUserProfile>({ userId: me.id, password: bcrypt.hashSync('synthetic-password', 4), twoFactorEnabled: true, twoFactorSecret: 'synthetic-existing', twoFactorTempSecret: 'JBSWY3DPEHPK3PXP', passkeyMfaEnabled: false });
	const locked = { ...profile };
	const profiles = mockDeep<UserProfilesRepository>();
	profiles.findOneByOrFail.mockResolvedValue(profile); profiles.findOne.mockResolvedValue(profile); profiles.findOneOrFail.mockResolvedValue(locked);
	const keys = mockDeep<UserSecurityKeysRepository>(); keys.count.mockResolvedValue(1);
	keys.findOneBy.mockResolvedValue(mockDeep<MiUserSecurityKey>({ id: 'AQID', userId: me.id }));
	const manager = mockDeep<EntityManager>();
	manager.getRepository.mockImplementation(entity => {
		if (entity === MiUserProfile) return profiles as unknown as ReturnType<EntityManager['getRepository']>;
		if (entity === MiUserSecurityKey) return keys as unknown as ReturnType<EntityManager['getRepository']>;
		throw new Error('Unsupported synthetic entity');
	});
	const committed = vi.fn(); const db = mockDeep<DataSource>();
	db.transaction.mockImplementation(async (...args) => {
		const callback = args.at(-1); if (typeof callback !== 'function') throw new Error('Missing synthetic transaction');
		const result = await callback(manager); committed(); return result;
	});
	const auth = mockDeep<Parameters<typeof createI2faDoneProcedure>[0]['userAuthService'] & Parameters<typeof createI2faKeyDoneProcedure>[0]['userAuthService']>(); auth.validateOtp.mockResolvedValue(true);
	const webauthn = mockDeep<Parameters<typeof createI2faKeyDoneProcedure>[0]['webAuthnService'] & Parameters<typeof createI2faRegisterKeyProcedure>[0]['webAuthnService']>();
	webauthn.verifyRegistration.mockResolvedValue({ credentialID: 'AQID', credentialPublicKey: new Uint8Array([1, 2, 3]), attestationObject: new Uint8Array(), fmt: 'none', counter: 0, userVerified: true, credentialDeviceType: 'singleDevice', credentialBackedUp: false });
	const events = mockDeep<Parameters<typeof createI2faDoneProcedure>[0]['globalEventService']>();
	const deps = { db, userProfilesRepository: profiles, userSecurityKeysRepository: keys, userAuthService: auth, webAuthnService: webauthn, globalEventService: events, userEntityService: mockDeep<Parameters<typeof createI2faDoneProcedure>[0]['userEntityService']>(), config: mockDeep<Parameters<typeof createI2faRegisterProcedure>[0]['config']>({ host: 'synthetic.example' }) };
	const invoke = {
		register: () => call(createI2faRegisterProcedure(deps), { password: 'synthetic-password', token: 'synthetic-recovery' }, { context: testContext(me) }),
		done: () => call(createI2faDoneProcedure(deps), { token: '123456' }, { context: testContext(me) }),
		keyStart: () => call(createI2faRegisterKeyProcedure(deps), { password: 'synthetic-password', token: 'synthetic-recovery' }, { context: testContext(me) }),
		keyDone: () => call(createI2faKeyDoneProcedure(deps), { password: 'synthetic-password', token: 'synthetic-recovery', name: 'Synthetic', credential: {} }, { context: testContext(me) }),
		passwordless: (value = true) => call(createI2faPasswordLessProcedure(deps), { value }, { context: testContext(me) }),
		rename: () => call(createI2faUpdateKeyProcedure(deps), { credentialId: 'AQID', name: 'Renamed' }, { context: testContext(me) }),
	};
	return { profile, locked, profiles, keys, db, auth, webauthn, committed, events, invoke };
}

test.each(['register', 'done', 'keyStart', 'keyDone', 'passwordless', 'rename'] as const)('independent policy denies legacy %s without proof or mutation', async action => {
	const f = fixture(); f.profile.passkeyMfaEnabled = true; f.locked.passkeyMfaEnabled = true;
	await expect(f.invoke[action]()).rejects.toThrow('authentication failed');
	expect(f.auth.twoFactorAuthenticate).not.toHaveBeenCalled(); expect(f.auth.validateOtp).not.toHaveBeenCalled();
	expect(f.webauthn.verifyRegistration).not.toHaveBeenCalled(); expect(f.webauthn.initiateRegistration).not.toHaveBeenCalled();
	expect(f.profiles.update).not.toHaveBeenCalled(); expect(f.keys.insert).not.toHaveBeenCalled(); expect(f.keys.update).not.toHaveBeenCalled(); expect(f.events.publishMainStream).not.toHaveBeenCalled();
});

test.each(['register', 'done', 'keyDone'] as const)('%s rechecks policy after proof before a transactional write', async action => {
	const f = fixture(); f.locked.password = 'changed-synthetic-hash';
	await expect(f.invoke[action]()).rejects.toThrow('authentication failed');
	expect(f.profiles.findOneOrFail).toHaveBeenCalledWith({ where: { userId: f.profile.userId }, lock: { mode: 'pessimistic_write' } });
	if (action === 'done') expect(f.auth.validateOtp.mock.invocationCallOrder[0]).toBeLessThan(f.db.transaction.mock.invocationCallOrder[0]);
	else expect(f.auth.twoFactorAuthenticate.mock.invocationCallOrder[0]).toBeLessThan(f.db.transaction.mock.invocationCallOrder[0]);
	if (action === 'keyDone') expect(f.webauthn.verifyRegistration.mock.invocationCallOrder[0]).toBeLessThan(f.db.transaction.mock.invocationCallOrder[0]);
	expect(f.keys.insert).not.toHaveBeenCalled(); expect(f.profiles.update).not.toHaveBeenCalled(); expect(f.events.publishMainStream).not.toHaveBeenCalled();
});

test('TOTP completion rejects a replaced pending secret and consumes the matching one on success', async () => {
	const f = fixture(); f.locked.twoFactorTempSecret = 'changed-pending-secret';
	await expect(f.invoke.done()).rejects.toThrow('authentication failed'); expect(f.profiles.update).not.toHaveBeenCalled();
	f.locked.twoFactorTempSecret = f.profile.twoFactorTempSecret;
	const result = await f.invoke.done();
	expect(result.backupCodes).toHaveLength(5);
	expect(f.profiles.update).toHaveBeenCalledWith({ userId: f.profile.userId }, { twoFactorEnabled: true, twoFactorSecret: f.profile.twoFactorTempSecret, twoFactorTempSecret: null, twoFactorBackupSecret: result.backupCodes });
	expect(f.committed.mock.invocationCallOrder[0]).toBeLessThan(f.events.publishMainStream.mock.invocationCallOrder[0]);
});

test('key insertion commits before notification and preserves key metadata', async () => {
	const f = fixture(); expect(await f.invoke.keyDone()).toEqual({ id: 'AQID', name: 'Synthetic' });
	expect(f.keys.insert).toHaveBeenCalledWith(expect.objectContaining({ id: 'AQID', userId: f.profile.userId, publicKey: 'AQID', name: 'Synthetic' }));
	expect(f.committed.mock.invocationCallOrder[0]).toBeLessThan(f.events.publishMainStream.mock.invocationCallOrder[0]);
});

test('TOTP setup returns the secret committed under the common profile lock', async () => {
	const f = fixture(); const result = await f.invoke.register();
	expect(result.secret).toMatch(/^[A-Z2-7]+$/); expect(result.qr).toMatch(/^data:image\/png;base64,/);
	expect(f.profiles.update).toHaveBeenCalledWith({ userId: f.profile.userId }, { twoFactorTempSecret: result.secret }); expect(f.committed).toHaveBeenCalledOnce();
});

test.each([true, false])('passwordless setting %s preserves successful legacy behavior under lock', async value => {
	const f = fixture(); await f.invoke.passwordless(value);
	expect(f.profiles.update).toHaveBeenCalledWith({ userId: f.profile.userId }, { usePasswordLessLogin: value });
	if (!value) expect(f.keys.count).not.toHaveBeenCalled();
	expect(f.committed.mock.invocationCallOrder[0]).toBeLessThan(f.events.publishMainStream.mock.invocationCallOrder[0]);
});

test('passwordless count and false-setting repair commit before the no-key error', async () => {
	const f = fixture(); f.keys.count.mockResolvedValue(0);
	await expect(f.invoke.passwordless()).rejects.toMatchObject({ code: 'NO_SECURITY_KEY' });
	expect(f.profiles.update).toHaveBeenCalledWith({ userId: f.profile.userId }, { usePasswordLessLogin: false }); expect(f.committed).toHaveBeenCalledOnce();
	expect(f.events.publishMainStream).not.toHaveBeenCalled();
});

test('rename preserves ownership checks and uses an owned transactional update', async () => {
	const f = fixture(); f.keys.findOneBy.mockResolvedValue(mockDeep<MiUserSecurityKey>({ id: 'AQID', userId: 'other' }));
	await expect(f.invoke.rename()).rejects.toMatchObject({ code: 'ACCESS_DENIED' }); expect(f.keys.update).not.toHaveBeenCalled();
	f.keys.findOneBy.mockResolvedValue(mockDeep<MiUserSecurityKey>({ id: 'AQID', userId: f.profile.userId }));
	expect(await f.invoke.rename()).toEqual({}); expect(f.keys.update).toHaveBeenCalledWith({ id: 'AQID', userId: f.profile.userId }, { name: 'Renamed' });
});
