/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import bcrypt from 'bcryptjs';
import { call } from '@orpc/server';
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { createSigninFlowProcedure, type SigninFlowDependencies } from '../../backend/endpoints/signinFlow.js';
import type { AuthSessionContext } from '../../backend/session.effects.js';
import type { AuthenticationProgressBinding, AuthenticationProgressMetadata } from '../../backend/authentication-progress-store.js';
import type { SigninProgressChallenge } from '../../backend/signin-progress.schema.js';
import type { PackedJsonValue } from '@features/users/backend/json-value.schema.js';

function harness(keys = false, totp = true) {
	const deps = mockDeep<SigninFlowDependencies>();
	deps.config.enableIpRateLimit = false; deps.config.url = 'https://synthetic.example'; deps.config.hostname = 'synthetic.example';
	const user = mockDeep<NonNullable<Awaited<ReturnType<typeof deps.usersRepository.findOneBy>>>>({ id: 'synthetic', host: null, isSuspended: false, isDeleted: false });
	const profile = mockDeep<Awaited<ReturnType<typeof deps.userProfilesRepository.findOneByOrFail>>>({ userId: 'synthetic', twoFactorEnabled: totp, usePasswordLessLogin: false, password: bcrypt.hashSync('synthetic-password', 4), twoFactorSecret: 'synthetic-secret' });
	deps.usersRepository.findOneBy.mockResolvedValue(user); deps.userProfilesRepository.findOneByOrFail.mockResolvedValue(profile); deps.userProfilesRepository.findOneBy.mockResolvedValue(profile);
	deps.userSecurityKeysRepository.countBy.mockResolvedValue(keys ? 1 : 0); deps.userSecurityKeysRepository.findBy.mockResolvedValue([]);
	deps.webAuthnService.initiateAuthentication.mockResolvedValue({ challenge: 'c3ludGhldGlj', rpId: 'synthetic.example', userVerification: 'required' });
	deps.webAuthnService.verifyAuthentication.mockResolvedValue(true); deps.signinService.signin.mockResolvedValue({ finished: true, id: user.id, i: 'synthetic-browser-session' });
	let binding: AuthenticationProgressBinding; let consumed = false; let claimed = false;
	const challenge = { ticket: 't'.repeat(43), browserSecret: 'b'.repeat(43), nonce: 'n'.repeat(43), version: 1 };
	const metadata = (): AuthenticationProgressMetadata => ({ ...binding, version: 1, state: 'active', createdAt: 1, facts: { password: 1 } });
	deps.progressStore.create.mockImplementation(async context => { binding = context; return { ...challenge, version: 0, metadata: { ...metadata(), facts: {} } }; });
	deps.progressStore.advance.mockImplementation(async () => ({ ...challenge, metadata: metadata() }));
	deps.progressStore.read.mockImplementation(async (context, input) => consumed || JSON.stringify(context) !== JSON.stringify(binding) || input.browserSecret !== challenge.browserSecret ? null : metadata());
	deps.progressStore.claim.mockImplementation(async () => { if (claimed) return null; claimed = true; return { nonce: 'o'.repeat(43), version: 2, metadata: { ...metadata(), state: 'claimed' } }; });
	deps.progressStore.finishClaim.mockImplementation(async (_context, _access, _owner, proof) => ({ nonce: 'f'.repeat(43), version: 3, metadata: { ...metadata(), state: 'claimed', facts: { password: 1, [proof.factor]: 2 } } }));
	deps.progressStore.consume.mockImplementation(async () => { consumed = true; return { ...metadata(), state: 'claimed', facts: { password: 1, totp: 2, passkey: 2 } }; });
	deps.progressStore.cancel.mockResolvedValue(true);
	const context: AuthSessionContext = { request: { ip: '127.0.0.1', headers: {} }, effects: { code: vi.fn(), header: vi.fn() }, response: {} };
	const procedure = createSigninFlowProcedure(deps); const request = { username: 'synthetic', password: 'synthetic-password', progressMode: 'v1' };
	return { deps, profile, user, challenge, request, invoke: (body: PackedJsonValue) => call(procedure, body, { context }) };
}

test.each([false, true])('password-first challenge %s gives state without a session', async keys => {
	const h = harness(keys); expect(await h.invoke(h.request)).toMatchObject({ finished: false, next: keys ? 'passkey' : 'totp', authenticationProgress: h.challenge }); expect(h.deps.signinService.signin).not.toHaveBeenCalled();
});
test.each(['totp', 'passkey'] as const)('%s consumes state before session issue and rejects replay', async factor => {
	const h = harness(factor === 'passkey'); await h.invoke(h.request); const proof: Record<string, PackedJsonValue> = factor === 'totp' ? { token: '123456' } : { credential: { id: 'synthetic-key' } }; const body = { ...h.request, authenticationProgress: h.challenge, ...proof };
	expect(await h.invoke(body)).toMatchObject({ finished: true, i: 'synthetic-browser-session' }); expect(h.deps.progressStore.consume.mock.invocationCallOrder[0]).toBeLessThan(h.deps.signinService.signin.mock.invocationCallOrder[0]);
	expect(await h.invoke(body)).toHaveProperty('error'); expect(h.deps.signinService.signin).toHaveBeenCalledOnce();
	if (factor === 'totp') expect(h.deps.userAuthService.twoFactorAuthenticate).toHaveBeenCalledOnce(); else expect(h.deps.webAuthnService.verifyAuthentication).toHaveBeenCalledOnce();
});
test.each(['missing', 'browser', 'password', 'disabled'] as const)('rejects changed %s before verifier', async scenario => {
	const h = harness(); await h.invoke(h.request); let authenticationProgress: SigninProgressChallenge | undefined = h.challenge;
	if (scenario === 'missing') authenticationProgress = undefined; if (scenario === 'browser') authenticationProgress = { ...h.challenge, browserSecret: 'x'.repeat(43) }; if (scenario === 'password') h.profile.password = bcrypt.hashSync('changed-password', 4); if (scenario === 'disabled') h.profile.twoFactorEnabled = false;
	expect(await h.invoke({ ...h.request, token: '123456', ...(authenticationProgress ? { authenticationProgress } : {}) })).toHaveProperty('error'); expect(h.deps.userAuthService.twoFactorAuthenticate).not.toHaveBeenCalled(); expect(h.deps.signinService.signin).not.toHaveBeenCalled();
});
test('factor success followed by suspension cannot issue a session', async () => {
	const h = harness(); await h.invoke(h.request); h.deps.userAuthService.twoFactorAuthenticate.mockImplementation(async () => { h.user.isSuspended = true; });
	expect(await h.invoke({ ...h.request, token: '123456', authenticationProgress: h.challenge })).toHaveProperty('error'); expect(h.deps.progressStore.consume).not.toHaveBeenCalled(); expect(h.deps.signinService.signin).not.toHaveBeenCalled();
});
test('session issuance failure leaves ticket spent', async () => {
	const h = harness(); await h.invoke(h.request); h.deps.signinService.signin.mockRejectedValue(new Error('synthetic DB failure')); const body = { ...h.request, token: '123456', authenticationProgress: h.challenge };
	await expect(h.invoke(body)).rejects.toThrow(); expect(await h.invoke(body)).toHaveProperty('error'); expect(h.deps.userAuthService.twoFactorAuthenticate).toHaveBeenCalledOnce();
});
test('legacy verifier requirement and TOTP-disabled orphan keys retain existing policy', async () => {
	const h = harness(); expect(await h.invoke({ username: 'synthetic', password: 'synthetic-password', token: '123456' })).toHaveProperty('finished', true); expect(h.deps.userAuthService.twoFactorAuthenticate).toHaveBeenCalledOnce(); expect(h.deps.progressStore.claim).not.toHaveBeenCalled();
	const orphan = harness(true, false); expect(await orphan.invoke(orphan.request)).toHaveProperty('finished', true); expect(orphan.deps.webAuthnService.verifyAuthentication).not.toHaveBeenCalled(); expect(orphan.deps.progressStore.create).not.toHaveBeenCalled();
});
