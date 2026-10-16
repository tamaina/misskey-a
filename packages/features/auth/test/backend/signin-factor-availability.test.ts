/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import { call } from '@orpc/server';
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import * as v from 'valibot';
import { createSigninFlowProcedure, type SigninFlowDependencies } from '../../backend/endpoints/signinFlow.js';
import { authSessionsContract } from '../../backend/api.definition.js';
import type { AuthSessionContext } from '../../backend/session.effects.js';

const option = { challenge: 'c3ludGhldGlj', rpId: 'synthetic.example', userVerification: 'required' as const };

function harness(totp = true, keys = true, passwordless = false) {
	const deps = mockDeep<SigninFlowDependencies>();
	deps.config.enableIpRateLimit = false;
	deps.usersRepository.findOneBy.mockResolvedValue(mockDeep<NonNullable<Awaited<ReturnType<typeof deps.usersRepository.findOneBy>>>>({ id: 'synthetic', isSuspended: false, isDeleted: false }));
	deps.userProfilesRepository.findOneByOrFail.mockResolvedValue(mockDeep<Awaited<ReturnType<typeof deps.userProfilesRepository.findOneByOrFail>>>({ userId: 'synthetic', twoFactorEnabled: totp, usePasswordLessLogin: passwordless, password: bcrypt.hashSync('synthetic-password', 4) }));
	deps.userSecurityKeysRepository.countBy.mockResolvedValue(keys ? 1 : 0);
	deps.webAuthnService.initiateAuthentication.mockResolvedValue(option);
	deps.signinService.signin.mockResolvedValue({ finished: true, id: 'synthetic', i: 'synthetic-session' });
	const context: AuthSessionContext = { request: { ip: '127.0.0.1', headers: {} }, effects: { code: vi.fn(), header: vi.fn() }, response: {} };
	const procedure = createSigninFlowProcedure(deps);
	return { deps, invoke: (body: { username: string; password?: string; token?: string; availableFactors?: string[] }) => call(procedure, body, { context }) };
}

test.each([false, true])('verified password exposes only current enabled factors, keys=%s', async keys => {
	const h = harness(true, keys);
	expect(await h.invoke({ username: 'synthetic', password: 'synthetic-password' })).toMatchObject({ finished: false, next: keys ? 'passkey' : 'totp', availableFactors: keys ? ['totp', 'passkey'] : ['totp'] });
	expect(h.deps.userAuthService.twoFactorAuthenticate).not.toHaveBeenCalled();
	expect(h.deps.signinService.signin).not.toHaveBeenCalled();
});

test.each([false, true])('username step never discloses availability, TOTP=%s', async totp => {
	const h = harness(totp, true);
	expect(await h.invoke({ username: 'synthetic' })).toEqual({ finished: false, next: totp ? 'password' : 'captcha' });
});

test('legacy wrong-password passwordless alternative retains challenge but omits factor disclosure', async () => {
	const h = harness(true, true, true);
	expect(await h.invoke({ username: 'synthetic', password: 'wrong' })).toEqual({ finished: false, next: 'passkey', authRequest: option });
	expect(h.deps.signinService.signin).not.toHaveBeenCalled();
});

test('wrong password without passwordless fails and client-supplied factors cannot authenticate', async () => {
	const h = harness();
	expect(await h.invoke({ username: 'synthetic', password: 'wrong', availableFactors: ['passkey'] })).toEqual({ error: { id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c' } });
	expect(h.deps.webAuthnService.initiateAuthentication).not.toHaveBeenCalled();
	expect(h.deps.signinService.signin).not.toHaveBeenCalled();
});

test('orphan keys with TOTP disabled remain password-only and are not activated by availability', async () => {
	const h = harness(false, true);
	expect(await h.invoke({ username: 'synthetic', password: 'synthetic-password' })).toEqual({ finished: true, id: 'synthetic', i: 'synthetic-session' });
	expect(h.deps.webAuthnService.initiateAuthentication).not.toHaveBeenCalled();
});

test('existing password plus TOTP authentication still gates completion', async () => {
	const h = harness();
	expect(await h.invoke({ username: 'synthetic', password: 'synthetic-password', token: '123456' })).toEqual({ finished: true, id: 'synthetic', i: 'synthetic-session' });
	expect(h.deps.userAuthService.twoFactorAuthenticate).toHaveBeenCalledOnce();
});

test('finite output accepts old responses and optional factor choices but rejects malformed or pre-proof fields', () => {
	const schema = authSessionsContract.signinFlow['~orpc'].outputSchema;
	if (!schema) throw new Error('Missing output contract');
	for (const response of [
		{ finished: false, next: 'password' }, { finished: false, next: 'totp' }, { finished: false, next: 'passkey', authRequest: option },
		{ finished: false, next: 'totp', availableFactors: ['totp'] }, { finished: false, next: 'passkey', authRequest: option, availableFactors: ['passkey'] },
	]) expect(v.safeParse(schema, response).success).toBe(true);
	for (const factors of [[], ['password'], ['totp', 4], ['totp', 'passkey', 'totp'], null]) {
		expect(v.safeParse(schema, { finished: false, next: 'passkey', authRequest: option, availableFactors: factors }).success).toBe(false);
	}
	expect(v.safeParse(schema, { finished: false, next: 'password', availableFactors: ['totp'] }).success).toBe(false);
	expect(v.safeParse(schema, { finished: true, id: 'synthetic', i: 'synthetic-session', availableFactors: ['totp'] }).success).toBe(false);
});
