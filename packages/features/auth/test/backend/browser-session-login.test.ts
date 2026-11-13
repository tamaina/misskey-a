/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { IsNull } from 'typeorm';
import { afterEach, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { AuthenticateService } from '../../backend/transport/AuthenticateService.js';
import { SigninService } from '../../backend/transport/SigninService.js';
import type { BrowserSessionService } from '../../backend/services/BrowserSessionService.js';
import type { UsersRepository, MiUser } from '../../../persistence/backend/repositories/models.js';
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
	const service = new SigninService(mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), sessions);
	return { service, sessions, effects };
}

test('successful signin issues a fresh credential instead of returning the master token', async () => {
	const h = signinFixture();
	h.sessions.issue.mockResolvedValue({ token: 'bs_synthetic', session: { id: 'session1', userId: 'alice', createdAt: new Date(0), lastUsedAt: new Date(0), revokedAt: null, sudoUntil: null } });
	const result = await h.service.signin({ ip: '127.0.0.1', headers: {} }, h.effects, { id: 'alice', token: 'old-master' });
	expect(result).toEqual({ finished: true, id: 'alice', i: 'bs_synthetic' });
	expect(h.sessions.issue).toHaveBeenCalledWith('alice');
	expect(h.effects.code).toHaveBeenCalledWith(200);
});

test('failed session persistence never reports a successful signin or schedules notifications', async () => {
	const h = signinFixture();
	h.sessions.issue.mockRejectedValue(new Error('synthetic insert failure'));
	await expect(h.service.signin({ ip: '127.0.0.1', headers: {} }, h.effects, { id: 'alice', token: 'old-master' })).rejects.toThrow('insert failure');
	expect(h.effects.code).not.toHaveBeenCalled();
	expect(vi.getTimerCount()).toBe(0);
});
