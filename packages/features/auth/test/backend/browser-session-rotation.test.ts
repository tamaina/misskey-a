/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { call } from '@orpc/server';
import bcrypt from 'bcryptjs';
import type { EntityManager } from 'typeorm';
import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { MiUser, MiBrowserSession } from '../../../persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../users/backend/models/User.js';
import { createIRegenerateTokenProcedure } from '../../backend/endpoints/i/regenerate-token.js';
import type { IRegenerateTokenDependencies } from '../../backend/endpoints/i/regenerate-token.js';
import { testContext } from './native-context.js';

function fixture() {
	const deps = mockDeep<IRegenerateTokenDependencies>();
	const user = mockDeep<MiLocalUser>({ id: 'alice', token: 'old-master', isSuspended: false, movedToUri: null });
	deps.usersRepository.findOneByOrFail.mockResolvedValue(user);
	deps.userProfilesRepository.findOneByOrFail.mockResolvedValue(mockDeep({ userId: 'alice', password: bcrypt.hashSync('synthetic-password', 4), twoFactorEnabled: true }));
	const manager = mockDeep<EntityManager>();
	const browserRows = mockDeep<NonNullable<Parameters<IRegenerateTokenDependencies['browserSessionService']['revokeAllOwned']>[1]>>();
	manager.getRepository.mockImplementation(entity => {
		if (entity === MiUser) return deps.usersRepository as unknown as ReturnType<EntityManager['getRepository']>;
		if (entity === MiBrowserSession) return browserRows as unknown as ReturnType<EntityManager['getRepository']>;
		throw new Error('unsupported synthetic repository');
	});
	let committed = false;
	deps.db.transaction.mockImplementation(async (...args) => {
		const callback = args.at(-1);
		if (typeof callback !== 'function') throw new Error('missing synthetic transaction callback');
		const result = await callback(manager);
		committed = true;
		return result;
	});
	const invoke = (token?: string) => call(createIRegenerateTokenProcedure(deps), { password: 'synthetic-password', ...(token === undefined ? {} : { token }) }, { context: testContext(user) });
	return { deps, manager, browserRows, user, invoke, committed: () => committed };
}

test('missing fresh MFA never rotates either credential class', async () => {
	const h = fixture();
	await expect(h.invoke()).rejects.toThrow('authentication failed');
	expect(h.deps.db.transaction).not.toHaveBeenCalled();
	expect(h.deps.browserSessionService.revokeAllOwned).not.toHaveBeenCalled();
	expect(h.deps.globalEventService.publishInternalEvent).not.toHaveBeenCalled();
});

test('rotation commits native update and browser invalidation together before disconnect events', async () => {
	const h = fixture();
	await h.invoke('synthetic-fresh-code');
	expect(h.committed()).toBe(true);
	expect(h.manager.getRepository).toHaveBeenCalledWith(MiUser);
	expect(h.manager.getRepository).toHaveBeenCalledWith(MiBrowserSession);
	expect(h.deps.browserSessionService.revokeAllOwned).toHaveBeenCalledWith('alice', h.browserRows);
	expect(h.deps.globalEventService.publishInternalEvent).toHaveBeenCalledWith('browserSessionRevoked', { id: null, userId: 'alice' });
	expect(h.deps.userAuthService.twoFactorAuthenticate.mock.invocationCallOrder[0]).toBeLessThan(h.deps.db.transaction.mock.invocationCallOrder[0]);
	expect(h.deps.browserSessionService.revokeAllOwned.mock.invocationCallOrder[0]).toBeLessThan(h.deps.globalEventService.publishInternalEvent.mock.invocationCallOrder[0]);
});

test('browser invalidation failure aborts the transaction and never publishes successful rotation', async () => {
	const h = fixture();
	h.deps.browserSessionService.revokeAllOwned.mockRejectedValue(new Error('synthetic database failure'));
	await expect(h.invoke('synthetic-fresh-code')).rejects.toThrow('database failure');
	expect(h.committed()).toBe(false);
	expect(h.deps.globalEventService.publishInternalEvent).not.toHaveBeenCalled();
	expect(h.deps.globalEventService.publishMainStream).not.toHaveBeenCalled();
});
