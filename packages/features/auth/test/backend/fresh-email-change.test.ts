/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { changeEmail, emailChangeTargetStamp } from '../../backend/email-change.js';
import { createIUpdateEmailProcedure } from '../../backend/endpoints/i/update-email.js';
import { createVerifyEmailProcedure } from '../../backend/endpoints/verify-email.js';
import { performance } from 'node:perf_hooks';
import bcrypt from 'bcryptjs';
import { call } from '@orpc/server';
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiBrowserSession } from '../../backend/models/BrowserSession.js';
import { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';
import { freshReauthenticationPolicyStamp } from '../../backend/fresh-passkey-reauthentication.js';
import { createUpdateEmailPasskeyStartProcedure, createUpdateEmailPasskeyCompleteProcedure } from '../../backend/endpoints/i/update-email-passkey.js';
import { testContext } from './native-context.js';
import type { UpdateEmailPasskeyDependencies } from '../../backend/endpoints/i/update-email-passkey.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DataSource, EntityManager } from 'typeorm';

const assertion = { id: 'AQID', rawId: 'AQID', type: 'public-key' as const, response: { clientDataJSON: 'AQID', authenticatorData: 'AQID', signature: 'AQID' }, clientExtensionResults: {} };

function fixture() {
	const me = mockDeep<MiLocalUser>({ id: 'syntheticuser', host: null, token: 'synthetic-native', isSuspended: false, isDeleted: false, movedToUri: null });
	const session = { id: 'syntheticsession', userId: me.id };
	const context = testContext(me); context.services.authenticate = async () => [me, null, session];
	const profile = mockDeep<MiUserProfile>({ userId: me.id, password: bcrypt.hashSync('synthetic-old', 4), twoFactorEnabled: true, twoFactorSecret: 'synthetic-secret', passkeyMfaEnabled: false, email: 'old@example.test', emailVerified: true, emailVerifyCode: null });
	const profiles = mockDeep<UserProfilesRepository>(); profiles.findOneOrFail.mockResolvedValue(profile); profiles.findOneByOrFail.mockResolvedValue(profile);
	const key = mockDeep<MiUserSecurityKey>({ id: 'AQID', userId: me.id, publicKey: 'AQID', counter: 1 });
	const keys = mockDeep<ReturnType<EntityManager['getRepository']>>(); keys.findBy.mockResolvedValue([key]);
	const sessions = mockDeep<ReturnType<EntityManager['getRepository']>>(); sessions.findOne.mockResolvedValue(mockDeep<MiBrowserSession>(session));
	const users = mockDeep<ReturnType<EntityManager['getRepository']>>(); users.findOne.mockResolvedValue(me); users.findOneByOrFail.mockResolvedValue(me);
	const manager = mockDeep<EntityManager>();
	manager.getRepository.mockImplementation(entity => {
		if (entity === MiUserProfile) return profiles as unknown as ReturnType<EntityManager['getRepository']>;
		if (entity === MiUserSecurityKey) return keys;
		if (entity === MiBrowserSession) return sessions;
		if (entity === MiUser) return users;
		throw new Error('Unsupported synthetic entity');
	});
	const db = mockDeep<DataSource>(); db.transaction.mockImplementation(async (...args) => { const run = args.at(-1); if (typeof run !== 'function') throw new Error('Missing transaction'); return await run(manager); });
	const fresh = mockDeep<UpdateEmailPasskeyDependencies['freshReauthentication']>();
	fresh.begin.mockResolvedValue({ ticket: 't'.repeat(43), options: { challenge: 'synthetic-challenge', userVerification: 'required', rpId: 'synthetic.example' } });
	const proof = { userId: me.id, sessionId: session.id, purpose: 'update-email' as const, targetStamp: emailChangeTargetStamp('new@example.test', profile), policyStamp: freshReauthenticationPolicyStamp(profile, [key]), expiresAtMonotonic: performance.now() + 90_000 };
	fresh.complete.mockResolvedValue(proof);
	const emailService = mockDeep<UpdateEmailPasskeyDependencies['emailService']>(); emailService.validateEmailForAccount.mockResolvedValue({ available: true, reason: null });
	const userEntityService = mockDeep<UpdateEmailPasskeyDependencies['userEntityService']>();
	const globalEventService = mockDeep<UpdateEmailPasskeyDependencies['globalEventService']>();
	const serverSettings = { emailRequiredForSignup: false };
	const deps = { db, config: { url: 'https://synthetic.example' }, serverSettings, userProfilesRepository: profiles, freshReauthentication: fresh, emailService, userEntityService, globalEventService };
	return { me, session, context, profile, profiles, keys, key, sessions, users, fresh, proof, db, manager, emailService, userEntityService, globalEventService, deps, serverSettings,
		start: (email: string | null = 'new@example.test') => call(createUpdateEmailPasskeyStartProcedure(deps), { currentPassword: 'synthetic-old', email }, { context }),
		complete: (email: string | null = 'new@example.test') => call(createUpdateEmailPasskeyCompleteProcedure(deps), { ticket: 't'.repeat(43), credential: assertion, email }, { context }),
	};
}

test('start binds the exact target and previous email state to the server-owned identity', async () => {
	const f = fixture(); expect(await f.start()).toMatchObject({ ticket: 't'.repeat(43), options: { userVerification: 'required' } });
	expect(f.fresh.begin).toHaveBeenCalledWith({ userId: f.me.id, browserSession: f.session, accessToken: null }, 'update-email', 'synthetic-old', f.proof.targetStamp);
	expect(f.db.transaction).not.toHaveBeenCalled(); expect(f.emailService.sendEmail).not.toHaveBeenCalled();
});
test('one transaction saves email, pending verification and code before effects', async () => {
	const f = fixture(); let committed = false;
	f.db.transaction.mockImplementationOnce(async (...args) => { const run = args.at(-1); if (typeof run !== 'function') throw new Error('Missing transaction'); const result = await run(f.manager); committed = true; return result; });
	f.globalEventService.publishMainStream.mockImplementation(() => { expect(committed).toBe(true); });
	f.emailService.sendEmail.mockImplementation(async () => { expect(committed).toBe(true); });
	await f.complete();
	expect(f.users.findOne).toHaveBeenCalledWith({ where: { id: f.me.id }, lock: { mode: 'pessimistic_write' } });
	expect(f.profiles.findOneOrFail).toHaveBeenCalledWith({ where: { userId: f.me.id }, lock: { mode: 'pessimistic_write' } });
	expect(f.profiles.update).toHaveBeenCalledExactlyOnceWith({ userId: f.me.id }, { email: 'new@example.test', emailVerified: false, emailVerifyCode: expect.any(String) });
	expect(f.emailService.sendEmail).toHaveBeenCalledExactlyOnceWith('new@example.test', 'Email verification', expect.stringContaining('/verify-email/'), expect.stringContaining('/verify-email/'));
});
test.each(['legacy', 'oauth', 'wrong-owner'] as const)('%s cannot start or complete', async kind => {
	const f = fixture();
	if (kind === 'legacy') f.context.services.authenticate = async () => [f.me, null];
	if (kind === 'oauth') f.context.services.authenticate = async () => [f.me, { permission: ['write:account'] }];
	if (kind === 'wrong-owner') f.context.services.authenticate = async () => [f.me, null, { ...f.session, userId: 'other' }];
	await expect(f.start()).rejects.toThrow(); await expect(f.complete()).rejects.toThrow(); expect(f.fresh.begin).not.toHaveBeenCalled(); expect(f.fresh.complete).not.toHaveBeenCalled(); expect(f.db.transaction).not.toHaveBeenCalled();
});
test.each(['session', 'user', 'policy', 'key', 'expired', 'purpose', 'target', 'previous-email', 'verification'] as const)('locked %s mismatch has no writes or effects', async kind => {
	const f = fixture();
	if (kind === 'session') f.sessions.findOne.mockResolvedValue(null);
	if (kind === 'user') f.users.findOne.mockResolvedValue(null);
	if (kind === 'policy') f.profile.passkeyMfaEnabled = true;
	if (kind === 'key') f.keys.findBy.mockResolvedValue([]);
	if (kind === 'expired') f.fresh.complete.mockResolvedValue({ ...f.proof, expiresAtMonotonic: 0 });
	if (kind === 'purpose') f.fresh.complete.mockResolvedValue({ ...f.proof, purpose: 'change-password' });
	if (kind === 'target') f.fresh.complete.mockResolvedValue({ ...f.proof, targetStamp: 'a'.repeat(64) });
	if (kind === 'previous-email') f.profile.email = 'other@example.test';
	if (kind === 'verification') f.profile.emailVerified = false;
	await expect(f.complete()).rejects.toMatchObject({ code: 'FRESH_REAUTHENTICATION_FAILED' }); expect(f.profiles.update).not.toHaveBeenCalled(); expect(f.emailService.sendEmail).not.toHaveBeenCalled(); expect(f.globalEventService.publishMainStream).not.toHaveBeenCalled();
});
test.each(['unavailable', 'required', 'write', 'expired-after-write'] as const)('%s refuses before effects', async kind => {
	const f = fixture();
	if (kind === 'unavailable') f.emailService.validateEmailForAccount.mockResolvedValue({ available: false, reason: 'used' });
	if (kind === 'required') f.serverSettings.emailRequiredForSignup = true;
	if (kind === 'write') f.profiles.update.mockRejectedValue(new Error('Synthetic DB error'));
	if (kind === 'expired-after-write') f.profiles.update.mockImplementation(async () => { vi.spyOn(performance, 'now').mockReturnValue(f.proof.expiresAtMonotonic + 1); return { affected: 1, raw: [], generatedMaps: [] }; });
	try { await expect(f.complete(kind === 'required' ? null : undefined)).rejects.toThrow(); } finally { vi.restoreAllMocks(); }
	expect(f.emailService.sendEmail).not.toHaveBeenCalled(); expect(f.globalEventService.publishMainStream).not.toHaveBeenCalled();
});
test('null target clears email and code without delivery', async () => {
	const f = fixture(); f.fresh.complete.mockResolvedValue({ ...f.proof, targetStamp: emailChangeTargetStamp(null, f.profile) });
	await f.complete(null); expect(f.profiles.update).toHaveBeenCalledWith({ userId: f.me.id }, { email: null, emailVerified: false, emailVerifyCode: null }); expect(f.emailService.sendEmail).not.toHaveBeenCalled();
});
test('SMTP failure occurs after commit and never triggers a second DB mutation', async () => {
	const f = fixture(); f.emailService.sendEmail.mockRejectedValue(new Error('Synthetic SMTP failure')); await expect(f.complete()).rejects.toThrow(); expect(f.profiles.update).toHaveBeenCalledOnce(); expect(f.globalEventService.publishMainStream).toHaveBeenCalledOnce();
});
test.each(['policy', 'native', 'session'] as const)('legacy %s mismatch refuses the locked mutation', async kind => {
	const f = fixture(); const authority = { kind: 'legacy' as const, nativeToken: f.me.token!, profile: { ...f.profile }, session: f.session };
	if (kind === 'policy') f.profile.passkeyMfaEnabled = true;
	if (kind === 'native') authority.nativeToken = 'old-native';
	if (kind === 'session') f.sessions.findOne.mockResolvedValue(null);
	await expect(changeEmail(f.deps, f.me.id, 'new@example.test', authority)).rejects.toThrow(); expect(f.profiles.update).not.toHaveBeenCalled(); expect(f.emailService.sendEmail).not.toHaveBeenCalled();
});
test('legacy active independent policy refuses before consuming a backup code', async () => {
	const f = fixture(); f.profile.passkeyMfaEnabled = true; const auth = mockDeep<Parameters<typeof createIUpdateEmailProcedure>[0]['userAuthService']>();
	await expect(call(createIUpdateEmailProcedure({ ...f.deps, usersRepository: f.users as never, userProfilesRepository: f.profiles, userAuthService: auth }), { password: 'synthetic-old', token: 'backup', email: 'new@example.test' }, { context: f.context })).rejects.toThrow();
	expect(auth.twoFactorAuthenticate).not.toHaveBeenCalled(); expect(f.profiles.update).not.toHaveBeenCalled();
});
test.each([0, 1])('verification publishes only a one-row exact code/address update (%i)', async affected => {
	const f = fixture(); f.profile.emailVerifyCode = 'synthetic-code'; f.profiles.findOneBy.mockResolvedValue(f.profile); f.profiles.update.mockResolvedValue({ affected, raw: [], generatedMaps: [] });
	const result = call(createVerifyEmailProcedure(f.deps), { code: 'synthetic-code' }, { context: f.context });
	if (affected === 1) { await result; expect(f.globalEventService.publishMainStream).toHaveBeenCalledOnce(); } else { await expect(result).rejects.toMatchObject({ code: 'NO_SUCH_CODE' }); expect(f.globalEventService.publishMainStream).not.toHaveBeenCalled(); }
	expect(f.profiles.update).toHaveBeenCalledWith({ userId: f.me.id, email: 'old@example.test', emailVerifyCode: 'synthetic-code' }, { emailVerified: true, emailVerifyCode: null });
});

test('legacy omission and explicit null retain different SET columns', async () => {
	for (const omitEmail of [false, true]) {
		const f = fixture(); const authority = { kind: 'legacy' as const, nativeToken: f.me.token!, profile: { ...f.profile }, omitEmail };
		await changeEmail(f.deps, f.me.id, null, authority);
		expect(f.profiles.update).toHaveBeenCalledWith({ userId: f.me.id }, { ...(omitEmail ? {} : { email: null }), emailVerified: false, emailVerifyCode: null }); expect(f.emailService.sendEmail).not.toHaveBeenCalled();
	}
});
test('fresh completion and legacy updates consume the same existing email rate bucket', async () => {
	const f = fixture(); const limit = vi.fn().mockResolvedValue({ info: { synthetic: true } }); f.context.services.limit = limit;
	const auth = mockDeep<Parameters<typeof createIUpdateEmailProcedure>[0]['userAuthService']>();
	await expect(f.complete()).rejects.toMatchObject({ code: 'RATE_LIMIT_EXCEEDED' });
	await expect(call(createIUpdateEmailProcedure({ ...f.deps, usersRepository: f.users as never, userProfilesRepository: f.profiles, userAuthService: auth }), { password: 'synthetic-old' }, { context: f.context })).rejects.toMatchObject({ code: 'RATE_LIMIT_EXCEEDED' });
	expect(limit.mock.calls).toEqual(Array.from({ length: 2 }, () => [{ duration: 3_600_000, max: 3, key: 'i/update-email' }, f.me.id, 1])); expect(f.db.transaction).not.toHaveBeenCalled(); expect(f.fresh.complete).not.toHaveBeenCalled();
});
