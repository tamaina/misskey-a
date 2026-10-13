/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { call } from '@orpc/server';
import bcrypt from 'bcryptjs';
import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { createSigninFlowProcedure } from '../../backend/endpoints/signinFlow.js';
import type { SigninFlowDependencies } from '../../backend/endpoints/signinFlow.js';
import type { PackedJsonValue } from '../../../users/backend/json-value.schema.js';
import type { AuthSessionContext } from '../../backend/session.effects.js';
import type { MiLocalUser } from '../../../users/backend/models/User.js';
import type { Logger } from '../../../runtime/backend/logging/logger.js';

function fixture(twoFactorEnabled = true) {
	const deps = mockDeep<SigninFlowDependencies>();
	const user = mockDeep<MiLocalUser>({ id: 'alice', host: null, isSuspended: false, isDeleted: false });
	deps.usersRepository.findOneBy.mockResolvedValue(user);
	deps.userProfilesRepository.findOneByOrFail.mockResolvedValue(mockDeep({ userId: 'alice', password: bcrypt.hashSync('synthetic-password', 4), twoFactorEnabled, usePasswordLessLogin: false }));
	deps.userSecurityKeysRepository.countBy.mockResolvedValue(0);
	deps.loggerService.getLogger.mockReturnValue(mockDeep<Logger>());
	deps.rateLimiterService.limit.mockResolvedValue(null);
	deps.signinService.signin.mockResolvedValue({ finished: true, id: 'alice', i: 'bs_synthetic' });
	const context: AuthSessionContext = { request: { ip: '127.0.0.1', headers: {} }, effects: mockDeep(), response: {} };
	const invoke = (input: { password?: string; token?: string; credential?: PackedJsonValue }) => call(createSigninFlowProcedure(deps), { username: 'alice', ...input }, { context });
	return { deps, user, invoke };
}

test('password-only completion awaits browser signin issuance after password validation', async () => {
	const h = fixture(false);
	expect(await h.invoke({ password: 'synthetic-password' })).toEqual({ finished: true, id: 'alice', i: 'bs_synthetic' });
	expect(h.deps.signinService.signin).toHaveBeenCalledOnce();
});

test('fresh second factor completes before browser issuance', async () => {
	const h = fixture();
	expect(await h.invoke({ password: 'synthetic-password', token: '111111' })).toEqual({ finished: true, id: 'alice', i: 'bs_synthetic' });
	expect(h.deps.userAuthService.twoFactorAuthenticate.mock.invocationCallOrder[0]).toBeLessThan(h.deps.signinService.signin.mock.invocationCallOrder[0]);
});

test('wrong password and rejected MFA never reach browser session issuance', async () => {
	const wrongPassword = fixture();
	await wrongPassword.invoke({ password: 'wrong', token: '111111' });
	expect(wrongPassword.deps.signinService.signin).not.toHaveBeenCalled();
	const wrongFactor = fixture();
	wrongFactor.deps.userAuthService.twoFactorAuthenticate.mockRejectedValue(new Error('synthetic rejected factor'));
	await wrongFactor.invoke({ password: 'synthetic-password', token: '111111' });
	expect(wrongFactor.deps.signinService.signin).not.toHaveBeenCalled();
});

test('passkey completion also awaits the shared issuer, while rejected credentials issue nothing', async () => {
	const h = fixture();
	h.deps.webAuthnService.verifyAuthentication.mockResolvedValue(true);
	expect(await h.invoke({ password: 'synthetic-password', credential: {} })).toEqual({ finished: true, id: 'alice', i: 'bs_synthetic' });
	const rejected = fixture();
	rejected.deps.webAuthnService.verifyAuthentication.mockResolvedValue(false);
	await rejected.invoke({ password: 'synthetic-password', credential: {} });
	expect(rejected.deps.signinService.signin).not.toHaveBeenCalled();
});

test('soft-deleted users cannot issue a browser session even with correct factors', async () => {
	const h = fixture();
	h.user.isDeleted = true;
	await h.invoke({ password: 'synthetic-password', token: '111111' });
	expect(h.deps.signinService.signin).not.toHaveBeenCalled();
});
