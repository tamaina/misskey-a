/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';

import { call } from '@orpc/server';
import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { createSigninWithPasskeyProcedure } from '../../backend/endpoints/signinWithPasskey.js';
import type { SigninWithPasskeyDependencies } from '../../backend/endpoints/signinWithPasskey.js';
import type { AuthSessionContext } from '../../backend/session.effects.js';

function harness(independent = true, passwordless = true) {
	const deps = mockDeep<SigninWithPasskeyDependencies>();
	deps.config.enableIpRateLimit = false;
	deps.loggerService.getLogger.mockReturnValue(mockDeep());
	const user = mockDeep<NonNullable<Awaited<ReturnType<typeof deps.usersRepository.findOneBy>>>>({ id: 'synthetic', token: 'synthetic-master', host: null, isSuspended: false, isDeleted: false });
	deps.usersRepository.findOneBy.mockResolvedValue(user);
	const profile = mockDeep<Awaited<ReturnType<typeof deps.userProfilesRepository.findOneByOrFail>>>({ userId: user.id, password: 'synthetic-hash', twoFactorEnabled: false, twoFactorSecret: null, passkeyMfaEnabled: independent, usePasswordLessLogin: passwordless });
	deps.userProfilesRepository.findOneByOrFail.mockResolvedValue(profile);
	deps.userSecurityKeysRepository.findBy.mockResolvedValue([mockDeep<MiUserSecurityKey>({ id: 'AQID', userId: user.id, publicKey: 'AQID' })]);
	deps.webAuthnService.verifySignInWithPasskeyWithProof.mockImplementation(async (_context, _response, before) => ({ key: { id: 'AQID', userId: user.id, publicKey: 'AQID', deadline: performance.now() + 90_000 }, expected: await before({ id: 'AQID', userId: user.id, publicKey: 'AQID' }) }));
	deps.signinService.signin.mockResolvedValue({ finished: true, id: user.id, i: 'bs_synthetic' });
	const context: AuthSessionContext = { request: { ip: '127.0.0.1', headers: {} }, effects: mockDeep(), response: {} };
	return { deps, user, profile, invoke: () => call(createSigninWithPasskeyProcedure(deps), { context: '00000000-0000-4000-8000-000000000000', credential: {} }, { context }) };
}

test.each([false, true])('independent policy returns named password flow without issuing a session, convenience=%s', async convenience => {
	const h = harness(true, convenience);
	expect(await h.invoke()).toEqual({ passwordFlowRequired: true });
	expect(h.deps.signinService.signin).not.toHaveBeenCalled();
});

test('legacy passwordless returns a server-owned proof to the shared issuer', async () => {
	const h = harness(false);
	expect(await h.invoke()).toEqual({ signinResponse: { finished: true, id: h.user.id, i: 'bs_synthetic' } });
	expect(h.deps.signinService.signin).toHaveBeenCalledWith(expect.anything(), expect.anything(), h.user, expect.objectContaining({ mode: 'passwordless', passwordVerified: false, factor: 'passkey' }));
});

test('legacy disabled passwordless and inactive accounts cannot obtain sessions', async () => {
	const disabled = harness(false, false); expect(await disabled.invoke()).toHaveProperty('error');
	expect(disabled.deps.signinService.signin).not.toHaveBeenCalled();
	const deleted = harness(); deleted.user.isDeleted = true;
	expect(await deleted.invoke()).toHaveProperty('error'); expect(deleted.deps.signinService.signin).not.toHaveBeenCalled();
});

test('invalid owned key cannot reach policy fallback or session issuance', async () => {
	const h = harness(); h.deps.userSecurityKeysRepository.findBy.mockResolvedValue([]);
	expect(await h.invoke()).toHaveProperty('error'); expect(h.deps.signinService.signin).not.toHaveBeenCalled();
});
