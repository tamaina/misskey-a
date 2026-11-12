/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { performance } from 'node:perf_hooks';
import { IsNull, type EntityManager } from 'typeorm';
import { afterEach, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { MiUser } from '../../../users/backend/models/User.js';
import { MiUserProfile } from '../../../users/backend/models/UserProfile.js';
import { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';
import { MiBrowserSession } from '../../backend/models/BrowserSession.js';
import { createSigninAssurance, signinPolicyStamp } from '../../backend/signin-assurance.js';
import { AuthenticateService } from '../../backend/transport/AuthenticateService.js';
import { SigninService } from '../../backend/transport/SigninService.js';
import type { BrowserSessionService } from '../../backend/services/BrowserSessionService.js';
import type { UsersRepository } from '../../../persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../users/backend/models/User.js';
import type { CacheService } from '../../../users/backend/services/CacheService.js';

const disposals: (() => void)[] = [];
afterEach(() => { for (const dispose of disposals.splice(0)) dispose(); vi.useRealTimers(); });

function authenticationFixture() {
	const users = mockDeep<UsersRepository>();
	const sessions = mockDeep<BrowserSessionService>();
	const cache = mockDeep<CacheService>();
	const accessTokens = mockDeep<ConstructorParameters<typeof AuthenticateService>[1]>();
	const service = new AuthenticateService(users, accessTokens, mockDeep(), cache, sessions);
	disposals.push(() => service.dispose());
	const actor = mockDeep<MiLocalUser>({ id: 'alice', host: null, isSuspended: false, isDeleted: false });
	const session = { id: 'session1', userId: 'alice', createdAt: new Date(0), lastUsedAt: new Date(0), revokedAt: null, sudoUntil: new Date(Date.now() + 60_000) };
	sessions.verify.mockResolvedValue(session);
	users.findOneBy.mockResolvedValue(actor);
	return { service, users, sessions, cache, accessTokens, actor };
}

test('browser authentication keeps first-party app/null semantics and only identity context', async () => {
	const h = authenticationFixture();
	const result = await h.service.authenticate(`bs_${'a'.repeat(43)}`);
	expect(result).toEqual([h.actor, null, { id: 'session1', userId: 'alice' }]);
	expect(result[2]).not.toHaveProperty('sudoUntil');
	expect(h.users.findOneBy).toHaveBeenCalledWith({ id: 'alice', host: IsNull(), isSuspended: false, isDeleted: false });
	expect(h.cache.localUserByIdCache.fetch).not.toHaveBeenCalled();
	expect(h.cache.localUserByNativeTokenCache.fetch).not.toHaveBeenCalled();
	expect(h.accessTokens.findOne).not.toHaveBeenCalled();
});

test('revoked/unknown browser sessions fail closed without legacy or app fallback', async () => {
	const h = authenticationFixture();
	h.sessions.verify.mockResolvedValue(null);
	await expect(h.service.authenticate('bs_invalid')).rejects.toThrow('invalid browser session');
	expect(h.users.findOneBy).not.toHaveBeenCalled();
	expect(h.accessTokens.findOne).not.toHaveBeenCalled();
	expect(h.cache.localUserByNativeTokenCache.fetch).not.toHaveBeenCalled();
});

test('fresh local-user checks reject deleted, remote, suspended and soft-deleted accounts', async () => {
	for (const user of [null, mockDeep<MiUser>({ id: 'alice', host: 'remote.test' }), mockDeep<MiLocalUser>({ id: 'alice', host: null, isSuspended: true, isDeleted: false }), mockDeep<MiLocalUser>({ id: 'alice', host: null, isSuspended: false, isDeleted: true })]) {
		const h = authenticationFixture();
		h.users.findOneBy.mockResolvedValue(user);
		await expect(h.service.authenticate(`bs_${'a'.repeat(43)}`)).rejects.toThrow('local user not found');
	}
});

test('legacy native credentials retain compatibility and never gain session identity', async () => {
	const h = authenticationFixture();
	h.cache.localUserByNativeTokenCache.fetch.mockResolvedValue(h.actor);
	expect(await h.service.authenticate('a'.repeat(16))).toEqual([h.actor, null]);
	expect(h.sessions.verify).not.toHaveBeenCalled();
});

test('database failure never authorizes a browser credential', async () => {
	const h = authenticationFixture();
	h.sessions.verify.mockRejectedValue(new Error('synthetic database unavailable'));
	await expect(h.service.authenticate(`bs_${'a'.repeat(43)}`)).rejects.toThrow('unavailable');
	expect(h.accessTokens.findOne).not.toHaveBeenCalled();
});

function signinFixture() {
	vi.useFakeTimers({ toFake: ['setImmediate'] });
	const sessions = mockDeep<BrowserSessionService>();
	const effects = mockDeep<Parameters<SigninService['signin']>[1]>();
	const profiles = mockDeep<ConstructorParameters<typeof SigninService>[1]>();
	const user = mockDeep<MiUser>({ id: 'alice', token: 'old-master', host: null, isSuspended: false, isDeleted: false });
	const profile = mockDeep<MiUserProfile>({ userId: user.id, password: 'synthetic-hash', twoFactorEnabled: false, twoFactorSecret: null, passkeyMfaEnabled: false, usePasswordLessLogin: false });
	const userRepo = { findOne: vi.fn(async () => user) };
	const profileRepo = { findOne: vi.fn(async () => profile) };
	const keyRepo = { findBy: vi.fn(async () => [] as MiUserSecurityKey[]) };
	const sessionRepo = { insert: vi.fn() };
	const manager = mockDeep<EntityManager>();
	manager.getRepository.mockImplementation(target => ({ [MiUser.name]: userRepo, [MiUserProfile.name]: profileRepo, [MiUserSecurityKey.name]: keyRepo, [MiBrowserSession.name]: sessionRepo })[(target as { name: string }).name] as never);
	let committed = false;
	profiles.manager.transaction.mockImplementation(async (isolationOrRun, maybeRun) => { const run = typeof isolationOrRun === 'function' ? isolationOrRun : maybeRun!; const result = await run(manager); committed = true; return result; });
	const service = new SigninService(mockDeep(), profiles, mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), sessions);
	const proof = () => createSigninAssurance({ userId: user.id, policyStamp: signinPolicyStamp(user, profile, []), mode: 'password', passwordVerified: true, factor: 'none', deadline: performance.now() + 90_000 });
	const invoke = (assurance = proof()) => service.signin({ ip: '127.0.0.1', headers: {} }, effects, user, assurance);
	return { service, sessions, effects, user, profile, proof, invoke, sessionRepo, userRepo, profileRepo, committed: () => committed };
}

test('successful signin issues a fresh credential instead of returning the master token', async () => {
	const h = signinFixture();
	h.sessions.issue.mockResolvedValue({ token: 'bs_synthetic', session: { id: 'session1', userId: 'alice', createdAt: new Date(0), lastUsedAt: new Date(0), revokedAt: null, sudoUntil: null } });
	const result = await h.invoke();
	expect(result).toEqual({ finished: true, id: 'alice', i: 'bs_synthetic' });
	expect(h.sessions.issue).toHaveBeenCalledWith('alice', h.sessionRepo);
	expect(h.effects.code).toHaveBeenCalledWith(200);
});

test('failed session persistence never reports a successful signin or schedules notifications', async () => {
	const h = signinFixture();
	h.sessions.issue.mockRejectedValue(new Error('synthetic insert failure'));
	await expect(h.invoke()).rejects.toThrow('insert failure');
	expect(h.effects.code).not.toHaveBeenCalled();
	expect(vi.getTimerCount()).toBe(0);
});

test('policy mutation between proof and issuance rejects before persistence or notifications', async () => {
	const h = signinFixture(); const proof = h.proof(); h.profile.passkeyMfaEnabled = true;
	await expect(h.invoke(proof)).rejects.toThrow('authentication failed');
	expect(h.sessions.issue).not.toHaveBeenCalled(); expect(h.effects.code).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
});

test('expired-after-insert proof rolls back and never publishes success', async () => {
	const h = signinFixture(); const proof = h.proof();
	h.sessions.issue.mockImplementation(async () => {
		vi.spyOn(performance, 'now').mockReturnValue(proof.deadline);
		return { token: 'bs_synthetic', session: { id: 's', userId: 'alice', createdAt: new Date(), lastUsedAt: new Date(), revokedAt: null, sudoUntil: null } };
	});
	try {
		await expect(h.invoke(proof)).rejects.toThrow('authentication failed');
		expect(h.committed()).toBe(false); expect(h.effects.code).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
	} finally { vi.restoreAllMocks(); }
});

test('proof cannot issue a second session after a failed persistence attempt', async () => {
	const h = signinFixture(); const proof = h.proof(); h.sessions.issue.mockRejectedValue(new Error('synthetic failure'));
	await expect(h.invoke(proof)).rejects.toThrow('synthetic failure');
	await expect(h.invoke(proof)).rejects.toThrow('authentication failed');
	expect(h.sessions.issue).toHaveBeenCalledOnce();
});
