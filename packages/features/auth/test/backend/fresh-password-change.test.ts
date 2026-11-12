/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { performance } from 'node:perf_hooks';
import bcrypt from 'bcryptjs';
import { call } from '@orpc/server';
import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { DataSource, EntityManager } from 'typeorm';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiUser } from '@features/users/backend/models/User.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { MiBrowserSession } from '../../backend/models/BrowserSession.js';
import { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { freshReauthenticationPolicyStamp } from '../../backend/fresh-passkey-reauthentication.js';
import { createChangePasswordPasskeyStartProcedure, createChangePasswordPasskeyCompleteProcedure } from '../../backend/endpoints/i/change-password-passkey.js';
import type { ChangePasswordPasskeyDependencies } from '../../backend/endpoints/i/change-password-passkey.js';
import { createIChangePasswordProcedure } from '../../backend/endpoints/i/change-password.js';
import { testContext } from './native-context.js';

const assertion = { id: 'AQID', rawId: 'AQID', type: 'public-key' as const, response: { clientDataJSON: 'AQID', authenticatorData: 'AQID', signature: 'AQID' }, clientExtensionResults: {} };

function fixture() {
	const me = mockDeep<MiLocalUser>({ id: 'syntheticuser', host: null, isSuspended: false, isDeleted: false, movedToUri: null });
	const session = { id: 'syntheticsession', userId: me.id };
	const context = testContext(me); context.services.authenticate = async () => [me, null, session];
	const profile = mockDeep<MiUserProfile>({ userId: me.id, password: bcrypt.hashSync('synthetic-old', 4), twoFactorEnabled: true, twoFactorSecret: 'synthetic-secret', passkeyMfaEnabled: false });
	const profiles = mockDeep<UserProfilesRepository>(); profiles.findOneOrFail.mockResolvedValue(profile); profiles.findOneByOrFail.mockResolvedValue(profile);
	const key = mockDeep<MiUserSecurityKey>({ id: 'AQID', userId: me.id, publicKey: 'AQID', counter: 1 });
	const keys = mockDeep<ReturnType<EntityManager['getRepository']>>(); keys.findBy.mockResolvedValue([key]);
	const sessions = mockDeep<ReturnType<EntityManager['getRepository']>>(); sessions.findOne.mockResolvedValue(mockDeep<MiBrowserSession>(session));
	const users = mockDeep<ReturnType<EntityManager['getRepository']>>(); users.findOneBy.mockResolvedValue(me);
	const manager = mockDeep<EntityManager>();
	manager.getRepository.mockImplementation(entity => {
		if (entity === MiUserProfile) return profiles as unknown as ReturnType<EntityManager['getRepository']>;
		if (entity === MiUserSecurityKey) return keys;
		if (entity === MiBrowserSession) return sessions;
		if (entity === MiUser) return users;
		throw new Error('Unsupported synthetic entity');
	});
	const db = mockDeep<DataSource>(); db.transaction.mockImplementation(async (...args) => { const run = args.at(-1); if (typeof run !== 'function') throw new Error('Missing transaction'); return await run(manager); });
	const fresh = mockDeep<ChangePasswordPasskeyDependencies['freshReauthentication']>();
	fresh.begin.mockResolvedValue({ ticket: 't'.repeat(43), options: { challenge: 'synthetic-challenge', userVerification: 'required', rpId: 'synthetic.example' } });
	const proof = { userId: me.id, sessionId: session.id, purpose: 'change-password' as const, policyStamp: freshReauthenticationPolicyStamp(profile, [key]), expiresAtMonotonic: performance.now() + 90_000 };
	fresh.complete.mockResolvedValue(proof);
	const deps = { db, freshReauthentication: fresh };
	return { me, session, context, profile, profiles, keys, key, sessions, users, fresh, proof, db,
		start: () => call(createChangePasswordPasskeyStartProcedure(deps), { currentPassword: 'synthetic-old' }, { context }),
		complete: () => call(createChangePasswordPasskeyCompleteProcedure(deps), { ticket: 't'.repeat(43), credential: assertion, newPassword: 'synthetic-new' }, { context }),
	};
}

test('start exposes only a dedicated ticket/options and uses server-owned browser identity', async () => {
	const f = fixture(); expect(await f.start()).toEqual({ ticket: 't'.repeat(43), options: { challenge: 'synthetic-challenge', userVerification: 'required', rpId: 'synthetic.example' } });
	expect(f.fresh.begin).toHaveBeenCalledWith({ userId: f.me.id, browserSession: f.session, accessToken: null }, 'change-password', 'synthetic-old');
	expect(f.profiles.update).not.toHaveBeenCalled();
});

test('complete stores only the password hash after locked current session/policy checks', async () => {
	const f = fixture(); await f.complete();
	expect(f.profiles.findOneOrFail).toHaveBeenCalledWith({ where: { userId: f.me.id }, lock: { mode: 'pessimistic_write' } });
	expect(f.sessions.findOne).toHaveBeenCalledWith(expect.objectContaining({ lock: { mode: 'pessimistic_write' } }));
	const [, update] = f.profiles.update.mock.calls[0];
	expect(typeof update === 'object' && typeof update.password === 'string' && await bcrypt.compare('synthetic-new', update.password)).toBe(true);
});

test.each(['legacy', 'oauth', 'wrong-owner'] as const)('%s cannot start or complete fresh password change', async kind => {
	const f = fixture();
	if (kind === 'legacy') f.context.services.authenticate = async () => [f.me, null];
	if (kind === 'oauth') f.context.services.authenticate = async () => [f.me, { permission: ['write:account'] }];
	if (kind === 'wrong-owner') f.context.services.authenticate = async () => [f.me, null, { ...f.session, userId: 'other' }];
	await expect(f.start()).rejects.toThrow(); await expect(f.complete()).rejects.toThrow();
	expect(f.fresh.begin).not.toHaveBeenCalled(); expect(f.fresh.complete).not.toHaveBeenCalled(); expect(f.db.transaction).not.toHaveBeenCalled();
});

test.each(['session', 'user', 'policy', 'key', 'expired', 'purpose'] as const)('locked %s mismatch never changes a password', async mismatch => {
	const f = fixture();
	if (mismatch === 'session') f.sessions.findOne.mockResolvedValue(null);
	if (mismatch === 'user') f.users.findOneBy.mockResolvedValue(null);
	if (mismatch === 'policy') f.profile.passkeyMfaEnabled = true;
	if (mismatch === 'key') f.keys.findBy.mockResolvedValue([]);
	if (mismatch === 'expired') f.fresh.complete.mockResolvedValue({ ...f.proof, expiresAtMonotonic: 0 });
	if (mismatch === 'purpose') f.fresh.complete.mockResolvedValue({ ...f.proof, purpose: 'show-recovery-codes' });
	await expect(f.complete()).rejects.toMatchObject({ code: 'FRESH_REAUTHENTICATION_FAILED' }); expect(f.profiles.update).not.toHaveBeenCalled();
});

test('legacy active policy is refused and stale legacy password proof cannot mutate', async () => {
	const f = fixture(); const auth = mockDeep<Parameters<typeof createIChangePasswordProcedure>[0]['userAuthService']>();
	const proc = createIChangePasswordProcedure({ db: f.db, userProfilesRepository: f.profiles, userAuthService: auth });
	f.profile.passkeyMfaEnabled = true;
	await expect(call(proc, { currentPassword: 'synthetic-old', newPassword: 'synthetic-new', token: 'synthetic-code' }, { context: f.context })).rejects.toThrow('authentication failed');
	expect(auth.twoFactorAuthenticate).not.toHaveBeenCalled();
	f.profile.passkeyMfaEnabled = false; f.profiles.findOneOrFail.mockResolvedValue({ ...f.profile, password: 'changed' });
	await expect(call(proc, { currentPassword: 'synthetic-old', newPassword: 'synthetic-new', token: 'synthetic-code' }, { context: f.context })).rejects.toThrow('authentication failed');
	expect(f.profiles.update).not.toHaveBeenCalled();
});
