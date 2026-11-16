/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
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
import { createRegenerateTokenPasskeyStartProcedure, createRegenerateTokenPasskeyCompleteProcedure } from '../../backend/endpoints/i/regenerate-token-passkey.js';
import { testContext } from './native-context.js';
import type { RegenerateTokenPasskeyDependencies } from '../../backend/endpoints/i/regenerate-token-passkey.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DataSource, EntityManager } from 'typeorm';

const assertion = { id: 'AQID', rawId: 'AQID', type: 'public-key' as const, response: { clientDataJSON: 'AQID', authenticatorData: 'AQID', signature: 'AQID' }, clientExtensionResults: {} };

function fixture() {
	const me = mockDeep<MiLocalUser>({ id: 'syntheticuser', host: null, token: 'synthetic-native', isSuspended: false, isDeleted: false, movedToUri: null });
	const session = { id: 'syntheticsession', userId: me.id };
	const context = testContext(me); context.services.authenticate = async () => [me, null, session];
	const profile = mockDeep<MiUserProfile>({ userId: me.id, password: bcrypt.hashSync('synthetic-old', 4), twoFactorEnabled: true, twoFactorSecret: 'synthetic-secret', passkeyMfaEnabled: false });
	const profiles = mockDeep<UserProfilesRepository>(); profiles.findOneOrFail.mockResolvedValue(profile); profiles.findOneByOrFail.mockResolvedValue(profile);
	const key = mockDeep<MiUserSecurityKey>({ id: 'AQID', userId: me.id, publicKey: 'AQID', counter: 1 });
	const keys = mockDeep<ReturnType<EntityManager['getRepository']>>(); keys.findBy.mockResolvedValue([key]);
	const sessions = mockDeep<ReturnType<EntityManager['getRepository']>>(); sessions.findOne.mockResolvedValue(mockDeep<MiBrowserSession>(session));
	const users = mockDeep<ReturnType<EntityManager['getRepository']>>(); users.findOne.mockResolvedValue(me);
	const manager = mockDeep<EntityManager>();
	manager.getRepository.mockImplementation(entity => {
		if (entity === MiUserProfile) return profiles as unknown as ReturnType<EntityManager['getRepository']>;
		if (entity === MiUserSecurityKey) return keys;
		if (entity === MiBrowserSession) return sessions;
		if (entity === MiUser) return users;
		throw new Error('Unsupported synthetic entity');
	});
	const db = mockDeep<DataSource>(); db.transaction.mockImplementation(async (...args) => { const run = args.at(-1); if (typeof run !== 'function') throw new Error('Missing transaction'); return await run(manager); });
	const fresh = mockDeep<RegenerateTokenPasskeyDependencies['freshReauthentication']>();
	fresh.begin.mockResolvedValue({ ticket: 't'.repeat(43), options: { challenge: 'synthetic-challenge', userVerification: 'required', rpId: 'synthetic.example' } });
	const proof = { userId: me.id, sessionId: session.id, purpose: 'regenerate-token' as const, policyStamp: freshReauthenticationPolicyStamp(profile, [key]), expiresAtMonotonic: performance.now() + 90_000 };
	fresh.complete.mockResolvedValue(proof);
	const browserSessionService = mockDeep<RegenerateTokenPasskeyDependencies['browserSessionService']>();
	const globalEventService = mockDeep<RegenerateTokenPasskeyDependencies['globalEventService']>();
	const deps = { db, freshReauthentication: fresh, browserSessionService, globalEventService };
	return { me, session, context, profile, profiles, keys, key, sessions, users, fresh, proof, db, manager, browserSessionService, globalEventService,
										start: () => call(createRegenerateTokenPasskeyStartProcedure(deps), { currentPassword: 'synthetic-old' }, { context }),
										complete: () => call(createRegenerateTokenPasskeyCompleteProcedure(deps), { ticket: 't'.repeat(43), credential: assertion }, { context }),
	};
}

test('start exposes only a dedicated ticket/options and uses server-owned browser identity', async () => {
	const f = fixture(); expect(await f.start()).toEqual({ ticket: 't'.repeat(43), options: { challenge: 'synthetic-challenge', userVerification: 'required', rpId: 'synthetic.example' } });
	expect(f.fresh.begin).toHaveBeenCalledWith({ userId: f.me.id, browserSession: f.session, accessToken: null }, 'regenerate-token', 'synthetic-old');
	expect(f.users.update).not.toHaveBeenCalled(); expect(f.browserSessionService.revokeAllOwned).not.toHaveBeenCalled(); expect(f.globalEventService.publishInternalEvent).not.toHaveBeenCalled();
});

test('complete rotates and revokes through the same manager, then publishes only after commit', async () => {
	const f = fixture(); let committed = false;
	f.db.transaction.mockImplementationOnce(async (...args) => { const run = args.at(-1); if (typeof run !== 'function') throw new Error('Missing transaction'); const result = await run(f.manager); committed = true; return result; });
	f.globalEventService.publishInternalEvent.mockImplementation(() => { expect(committed).toBe(true); });
	expect(await f.complete()).toBeUndefined();
	expect(f.users.findOne).toHaveBeenCalledWith({ where: { id: f.me.id }, lock: { mode: 'pessimistic_write' } });
	expect(f.profiles.findOneOrFail).toHaveBeenCalledWith({ where: { userId: f.me.id }, lock: { mode: 'pessimistic_write' } });
	expect(f.sessions.findOne).toHaveBeenCalledWith(expect.objectContaining({ lock: { mode: 'pessimistic_write' } }));
	expect(f.users.update).toHaveBeenCalledWith(f.me.id, { token: expect.any(String) });
	expect(f.browserSessionService.revokeAllOwned).toHaveBeenCalledWith(f.me.id, f.sessions);
	expect(f.globalEventService.publishInternalEvent).toHaveBeenCalledWith('browserSessionRevoked', { id: null, userId: f.me.id });
	expect(f.globalEventService.publishInternalEvent).toHaveBeenCalledWith('userTokenRegenerated', { id: f.me.id, oldToken: 'synthetic-native', newToken: expect.any(String) });
	expect(f.globalEventService.publishMainStream).toHaveBeenCalledWith(f.me.id, 'myTokenRegenerated');
});

test.each(['legacy', 'oauth', 'wrong-owner'] as const)('%s cannot start or complete fresh token regeneration', async kind => {
	const f = fixture();
	if (kind === 'legacy') f.context.services.authenticate = async () => [f.me, null];
	if (kind === 'oauth') f.context.services.authenticate = async () => [f.me, { permission: ['write:account'] }];
	if (kind === 'wrong-owner') f.context.services.authenticate = async () => [f.me, null, { ...f.session, userId: 'other' }];
	await expect(f.start()).rejects.toThrow(); await expect(f.complete()).rejects.toThrow();
	expect(f.fresh.begin).not.toHaveBeenCalled(); expect(f.fresh.complete).not.toHaveBeenCalled(); expect(f.db.transaction).not.toHaveBeenCalled();
});

test.each(['session', 'user', 'policy', 'key', 'expired', 'purpose'] as const)('locked %s mismatch never rotates or revokes', async mismatch => {
	const f = fixture();
	if (mismatch === 'session') f.sessions.findOne.mockResolvedValue(null);
	if (mismatch === 'user') f.users.findOne.mockResolvedValue(null);
	if (mismatch === 'policy') f.profile.passkeyMfaEnabled = true;
	if (mismatch === 'key') f.keys.findBy.mockResolvedValue([]);
	if (mismatch === 'expired') f.fresh.complete.mockResolvedValue({ ...f.proof, expiresAtMonotonic: 0 });
	if (mismatch === 'purpose') f.fresh.complete.mockResolvedValue({ ...f.proof, purpose: 'show-recovery-codes' });
	await expect(f.complete()).rejects.toMatchObject({ code: 'FRESH_REAUTHENTICATION_FAILED' }); expect(f.users.update).not.toHaveBeenCalled(); expect(f.browserSessionService.revokeAllOwned).not.toHaveBeenCalled(); expect(f.globalEventService.publishInternalEvent).not.toHaveBeenCalled();
});

test.each(['revocation-write', 'deadline-after-write'] as const)('%s failure never publishes a successful rotation', async kind => {
	const f = fixture();
	if (kind === 'revocation-write') f.browserSessionService.revokeAllOwned.mockRejectedValue(new Error('Synthetic DB failure'));
	else f.browserSessionService.revokeAllOwned.mockImplementation(async () => { vi.spyOn(performance, 'now').mockReturnValue(Number.MAX_SAFE_INTEGER); });
	try { await expect(f.complete()).rejects.toMatchObject({ code: 'FRESH_REAUTHENTICATION_FAILED' }); } finally { vi.restoreAllMocks(); }
	expect(f.globalEventService.publishInternalEvent).not.toHaveBeenCalled(); expect(f.globalEventService.publishMainStream).not.toHaveBeenCalled();
});

test.each(['remote', 'suspended', 'deleted'] as const)('current %s account cannot rotate or revoke', async state => {
	const f = fixture();
	const current = { ...f.me };
	if (state === 'remote') Object.assign(current, { host: 'synthetic.example' });
	if (state === 'suspended') current.isSuspended = true;
	if (state === 'deleted') current.isDeleted = true;
	f.users.findOne.mockResolvedValue(current);
	await expect(f.complete()).rejects.toMatchObject({ code: 'FRESH_REAUTHENTICATION_FAILED' });
	expect(f.users.update).not.toHaveBeenCalled(); expect(f.browserSessionService.revokeAllOwned).not.toHaveBeenCalled(); expect(f.globalEventService.publishInternalEvent).not.toHaveBeenCalled();
});
