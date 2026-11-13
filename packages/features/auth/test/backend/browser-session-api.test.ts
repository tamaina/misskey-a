/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { call } from '@orpc/server';
import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { MiLocalUser } from '../../../users/backend/models/User.js';
import type { ApiContext, BrowserSessionIdentity, ApiToken } from '../../../api/backend/transport/context.js';
import { testContext } from './native-context.js';
import { createISessionsProcedure, createISessionsRevokeProcedure, createISignoutProcedure } from '../../backend/endpoints/i/sessions.js';
import type { BrowserSessionDependencies } from '../../backend/endpoints/i/sessions.js';

function fixture(session: BrowserSessionIdentity | undefined, token: ApiToken | null = null) {
	const user = mockDeep<MiLocalUser>({ id: 'alice', isSuspended: false });
	const context: ApiContext<MiLocalUser> = testContext(user, token);
	context.services.authenticate = async () => [user, token, session];
	context.response = mockDeep<NonNullable<ApiContext<MiLocalUser>['response']>>();
	const deps = mockDeep<BrowserSessionDependencies>();
	return { deps, context };
}

const current = { id: 'session1', userId: 'alice' };

test('bounded owned list returns only public metadata with current identity', async () => {
	const { deps, context } = fixture(current);
	deps.browserSessionService.listOwned.mockResolvedValue([{ ...current, createdAt: new Date(0), lastUsedAt: new Date(0), revokedAt: null, sudoUntil: new Date(1000) }]);
	const result = await call(createISessionsProcedure(deps), { limit: 10, offset: 3 }, { context });
	expect(deps.browserSessionService.listOwned).toHaveBeenCalledWith('alice', 10, 3);
	expect(result).toEqual([{ id: 'session1', createdAt: new Date(0).toISOString(), lastUsedAt: new Date(0).toISOString(), revokedAt: null, current: true }]);
});

test('unowned/nonexistent revocation does not reveal or publish anything', async () => {
	const { deps, context } = fixture(current);
	deps.browserSessionService.revokeOwned.mockResolvedValue(false);
	await call(createISessionsRevokeProcedure(deps), { sessionId: 'other' }, { context });
	expect(deps.browserSessionService.revokeOwned).toHaveBeenCalledWith('alice', 'other');
	expect(deps.globalEventService.publishInternalEvent).not.toHaveBeenCalled();
});

test('owned revocation publishes only the selected session', async () => {
	const { deps, context } = fixture(current);
	deps.browserSessionService.revokeOwned.mockResolvedValue(true);
	await call(createISessionsRevokeProcedure(deps), { sessionId: 'session2' }, { context });
	expect(deps.globalEventService.publishInternalEvent).toHaveBeenCalledWith('browserSessionRevoked', { id: 'session2', userId: 'alice' });
});

test('signout awaits owned durable invalidation before publishing', async () => {
	const { deps, context } = fixture(current);
	deps.browserSessionService.revokeOwned.mockResolvedValue(true);
	await call(createISignoutProcedure(deps), {}, { context });
	expect(deps.browserSessionService.revokeOwned).toHaveBeenCalledWith('alice', 'session1');
	expect(context.response?.header).toHaveBeenCalledWith('Set-Cookie', 'token=; Path=/; Max-Age=0; SameSite=Lax');
	expect(deps.globalEventService.publishInternalEvent).toHaveBeenCalledWith('browserSessionRevoked', current);
	expect(deps.browserSessionService.revokeOwned.mock.invocationCallOrder[0]).toBeLessThan(deps.globalEventService.publishInternalEvent.mock.invocationCallOrder[0]);
});

test('legacy and mismatched identities cannot claim server-side signout', async () => {
	for (const identity of [undefined, { id: 'session1', userId: 'bob' }]) {
		const { deps, context } = fixture(identity);
		await expect(call(createISignoutProcedure(deps), {}, { context })).rejects.toMatchObject({ code: 'SESSION_NOT_REVOCABLE' });
		expect(deps.browserSessionService.revokeOwned).not.toHaveBeenCalled();
	}
});

test('scoped app cannot list, revoke or sign out browser sessions', async () => {
	const { deps, context } = fixture(current, { id: 'app', permission: ['read:account'] });
	await expect(call(createISessionsProcedure(deps), {}, { context })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
	await expect(call(createISignoutProcedure(deps), {}, { context })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
	await expect(call(createISessionsRevokeProcedure(deps), { sessionId: 'session1' }, { context })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
	expect(deps.browserSessionService.listOwned).not.toHaveBeenCalled();
	expect(deps.browserSessionService.revokeOwned).not.toHaveBeenCalled();
});

test('storage failure never reports successful signout or publishes', async () => {
	const { deps, context } = fixture(current);
	deps.browserSessionService.revokeOwned.mockRejectedValue(new Error('synthetic storage unavailable'));
	await expect(call(createISignoutProcedure(deps), {}, { context })).rejects.toThrow();
	expect(context.response?.header).not.toHaveBeenCalled();
	expect(deps.globalEventService.publishInternalEvent).not.toHaveBeenCalled();
});
