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
import type { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';
import type { PackedJsonValue } from '@features/users/backend/json-value.schema.js';
import type { AuthSessionContext } from '../../backend/session.effects.js';

const option = { challenge: 'c3ludGhldGlj', rpId: 'synthetic.example', userVerification: 'required' as const };

function harness(totp = true, keys = true, passwordless = false, independent = false) {
	const deps = mockDeep<SigninFlowDependencies>();
	deps.config.enableIpRateLimit = false;
	deps.usersRepository.findOneBy.mockResolvedValue(mockDeep<NonNullable<Awaited<ReturnType<typeof deps.usersRepository.findOneBy>>>>({ id: 'synthetic', host: null, isSuspended: false, isDeleted: false }));
	deps.userProfilesRepository.findOneByOrFail.mockResolvedValue(mockDeep<Awaited<ReturnType<typeof deps.userProfilesRepository.findOneByOrFail>>>({ userId: 'synthetic', twoFactorEnabled: totp, twoFactorSecret: totp ? 'synthetic-secret' : null, passkeyMfaEnabled: independent, twoFactorBackupSecret: [], usePasswordLessLogin: passwordless, password: bcrypt.hashSync('synthetic-password', 4) }));
	deps.userSecurityKeysRepository.findBy.mockResolvedValue(keys ? [mockDeep<MiUserSecurityKey>({ id: 'AQID', userId: 'synthetic', publicKey: 'AQID' })] : []);
	deps.webAuthnService.initiateAuthentication.mockResolvedValue(option);
	deps.signinService.signin.mockResolvedValue({ finished: true, id: 'synthetic', i: 'synthetic-session' });
	const context: AuthSessionContext = { request: { ip: '127.0.0.1', headers: {} }, effects: { code: vi.fn(), header: vi.fn() }, response: {} };
	const procedure = createSigninFlowProcedure(deps);
	return { deps, invoke: (body: { username: string; password?: string; token?: string; credential?: PackedJsonValue; availableFactors?: string[] }) => call(procedure, body, { context }) };
}

test.each([false, true])('verified password exposes only current enabled factors, keys=%s', async keys => {
	const h = harness(true, keys);
	expect(await h.invoke({ username: 'synthetic', password: 'synthetic-password' })).toMatchObject({ finished: false, next: 'totp', availableFactors: ['totp'] });
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

test('independent passkey MFA advertises the enabled key without inventing a TOTP factor', async () => {
	const h = harness(false, true, true, true);
	expect(await h.invoke({ username: 'synthetic', password: 'synthetic-password' })).toMatchObject({ finished: false, next: 'passkey', availableFactors: ['passkey'] });
	expect(h.deps.signinService.signin).not.toHaveBeenCalled();
});

test('explicit passwordless still offers a strict-UV challenge with independent MFA', async () => {
	const h = harness(false, true, true, true);
	expect(await h.invoke({ username: 'synthetic', password: 'wrong' })).toEqual({ finished: false, next: 'passkey', authRequest: option });
	expect(h.deps.webAuthnService.initiateAuthentication).toHaveBeenCalledWith('synthetic', true);
	expect(h.deps.signinService.signin).not.toHaveBeenCalled();
});

test('disabled TOTP cannot use the test-environment OTP shortcut under independent policy', async () => {
	const h = harness(false, true, true, true);
	expect(await h.invoke({ username: 'synthetic', password: 'synthetic-password', token: '123456' })).toHaveProperty('error');
	expect(h.deps.userAuthService.twoFactorAuthenticate).not.toHaveBeenCalled();
	expect(h.deps.signinService.signin).not.toHaveBeenCalled();
});

test('disabled passkey MFA rejects a supplied second-factor credential before verification', async () => {
	const h = harness(true, true, true, false);
	expect(await h.invoke({ username: 'synthetic', password: 'synthetic-password', credential: { id: 'AQID' } })).toHaveProperty('error');
	expect(h.deps.webAuthnService.verifyAuthenticationWithProof).not.toHaveBeenCalled();
	expect(h.deps.signinService.signin).not.toHaveBeenCalled();
});

test('TOTP and explicitly enabled passkey MFA both remain available', async () => {
	const h = harness(true, true, false, true);
	expect(await h.invoke({ username: 'synthetic', password: 'synthetic-password' })).toMatchObject({ next: 'passkey', availableFactors: ['totp', 'passkey'] });
});

test.each([false, true])('passwordless primary completion stays independent of disabled passkey MFA, TOTP=%s', async totp => {
	const h = harness(totp, true, true, false);
	h.deps.webAuthnService.verifyAuthenticationWithProof.mockImplementation(async (_id, _response, before) => {
		const key = { id: 'AQID', userId: 'synthetic', publicKey: 'AQID', userVerified: true, deadline: performance.now() + 90_000 };
		return { key, expected: await before(key) };
	});
	expect(await h.invoke({ username: 'synthetic', password: 'wrong' })).toEqual({ finished: false, next: 'passkey', authRequest: option });
	expect(await h.invoke({ username: 'synthetic', password: 'wrong', credential: { id: 'AQID' } })).toHaveProperty('finished', true);
	expect(h.deps.webAuthnService.verifyAuthenticationWithProof).toHaveBeenCalledWith('synthetic', expect.anything(), expect.any(Function), true);
	expect(h.deps.signinService.signin).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(), expect.objectContaining({ mode: 'passwordless', passwordVerified: false, factor: 'passkey' }));
});
