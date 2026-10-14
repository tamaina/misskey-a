/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { call } from '@orpc/server';
import { afterEach, expect, test, vi } from 'vitest';
import { mock, mockDeep } from 'vitest-mock-extended';
import { createSignupProcedure } from '../../backend/endpoints/signup.js';
import { createSignupPendingProcedure } from '../../backend/endpoints/signupPending.js';
import { createAdminAccountsCreateProcedure } from '../../backend/endpoints/admin/accounts/create.js';
import { testContext } from './native-context.js';
import type { MiUserPending, MiUserProfile } from '../../../persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../users/backend/models/User.js';
import type { AuthSessionContext } from '../../backend/session.effects.js';
import type { SignupDependencies } from '../../backend/endpoints/signup.js';
import type { SignupPendingDependencies } from '../../backend/endpoints/signupPending.js';
import type { AdminAccountsCreateDependencies } from '../../backend/endpoints/admin/accounts/create.js';

const account = mockDeep<MiLocalUser>({ id: 'alice', host: null, token: 'legacy-master' });
const session = { token: 'bs_synthetic', session: { id: 'session1', userId: 'alice', createdAt: new Date(0), lastUsedAt: new Date(0), revokedAt: null, sudoUntil: null } };

type PackedSelf = Awaited<ReturnType<SignupDependencies['userEntityService']['packSelf']>>;

function packedSelf() {
	return Object.assign(mock<PackedSelf>(), {
		id: 'alice', host: null, emojis: {}, avatarDecorations: [], alsoKnownAs: [], fields: [], verifiedLinks: [], pinnedNoteIds: [], pinnedNotes: [], pinnedPage: null, roles: [],
		notificationRecieveConfig: {}, unreadAnnouncements: [], mutedWords: [], hardMutedWords: [], mutedInstances: [], mutingNotificationTypes: [], emailNotificationTypes: [], achievements: [], policies: mock<PackedSelf['policies']>({ uploadableFileTypes: [] }), securityKeysList: [],
	});
}

function signupFixture() {
	const deps = mockDeep<SignupDependencies>();
	deps.meta.emailRequiredForSignup = false;
	deps.meta.disableRegistration = false;
	Object.assign(deps.meta, { enableHcaptcha: false, enableMcaptcha: false, enableRecaptcha: false, enableTurnstile: false, enableTestcaptcha: false });
	deps.signupService.signup.mockResolvedValue({ account, secret: 'legacy-master' });
	deps.userEntityService.packSelf.mockResolvedValue(packedSelf());
	deps.browserSessionService.issueForNewAccount.mockResolvedValue(session);
	const context: AuthSessionContext = { request: { ip: '127.0.0.1', headers: {} }, effects: mockDeep(), response: {} };
	return { deps, context };
}

test('ordinary signup returns its new browser credential, never the legacy master', async () => {
	const { deps, context } = signupFixture();
	const result = await call(createSignupProcedure(deps), { username: 'alice', password: 'synthetic-password' }, { context });
	expect(result?.token).toBe('bs_synthetic');
	expect(deps.browserSessionService.issueForNewAccount).toHaveBeenCalledWith(account);
	expect(deps.browserSessionService.issueForNewAccount.mock.invocationCallOrder[0]).toBeGreaterThan(deps.signupService.signup.mock.invocationCallOrder[0]);
});

test('failed signup session insert never returns the legacy credential as a fallback', async () => {
	const { deps, context } = signupFixture();
	deps.browserSessionService.issueForNewAccount.mockRejectedValue(new Error('synthetic insert failure'));
	await expect(call(createSignupProcedure(deps), { username: 'alice', password: 'synthetic-password' }, { context })).rejects.toThrow();
});

test('admin account creation returns an individual browser credential after existing setup checks', async () => {
	const deps = mockDeep<AdminAccountsCreateDependencies>();
	deps.config.setupPassword = 'synthetic-setup';
	deps.serverSettings.rootUserId = null;
	deps.signupService.signup.mockResolvedValue({ account, secret: 'legacy-master' });
	deps.userEntityService.packSelf.mockResolvedValue(packedSelf());
	deps.browserSessionService.issueForNewAccount.mockResolvedValue(session);
	const result = await call(createAdminAccountsCreateProcedure(deps), { username: 'alice', password: 'synthetic-password', setupPassword: 'synthetic-setup' }, { context: testContext(null) });
	expect(result.token).toBe('bs_synthetic');
	expect(deps.browserSessionService.issueForNewAccount).toHaveBeenCalledOnce();
});

test('invalid initial setup never creates an account or browser session', async () => {
	const deps = mockDeep<AdminAccountsCreateDependencies>();
	deps.config.setupPassword = 'synthetic-setup';
	deps.serverSettings.rootUserId = null;
	await expect(call(createAdminAccountsCreateProcedure(deps), { username: 'alice', password: 'synthetic-password', setupPassword: 'wrong' }, { context: testContext(null) })).rejects.toThrow();
	expect(deps.signupService.signup).not.toHaveBeenCalled();
	expect(deps.browserSessionService.issueForNewAccount).not.toHaveBeenCalled();
});

test('pending signup awaits the shared signin issuer exactly once', async () => {
	const deps = mockDeep<SignupPendingDependencies>();
	deps.userPendingsRepository.findOneByOrFail.mockResolvedValue(mockDeep<MiUserPending>({ id: 'pending1', username: 'alice', password: 'hashed-synthetic', email: 'alice@example.test' }));
	deps.idService.parse.mockReturnValue({ date: new Date() });
	deps.signupService.signup.mockResolvedValue({ account, secret: 'legacy-master' });
	deps.userProfilesRepository.findOneByOrFail.mockResolvedValue(mockDeep<MiUserProfile>({ userId: 'alice' }));
	deps.registrationTicketsRepository.findOneBy.mockResolvedValue(null);
	deps.signinService.signinSignup.mockResolvedValue({ finished: true, id: 'alice', i: 'bs_synthetic' });
	const context: AuthSessionContext = { request: { ip: '127.0.0.1', headers: {} }, effects: mockDeep(), response: {} };
	expect(await call(createSignupPendingProcedure(deps), { code: 'synthetic-code' }, { context })).toEqual({ finished: true, id: 'alice', i: 'bs_synthetic' });
	expect(deps.signinService.signinSignup).toHaveBeenCalledOnce();
});

afterEach(() => vi.unstubAllEnvs());

test('test-only synthetic remote creation returns no login credential and never calls the local issuer', async () => {
	vi.stubEnv('NODE_ENV', 'test'); const { deps, context } = signupFixture(); const host = 'synthetic.example.invalid';
	deps.signupService.signup.mockResolvedValue({ account: { ...account, host }, secret: 'legacy-master' });
	deps.userEntityService.packSelf.mockResolvedValue({ ...packedSelf(), host });
	const result = await call(createSignupProcedure(deps), { username: 'alice', password: 'synthetic-password', host }, { context });
	expect(result).toMatchObject({ id: 'alice', host, token: '' });
	expect(deps.browserSessionService.issueForNewAccount).not.toHaveBeenCalled();
});

test('production ignores the synthetic host input and still requires the local new-account issuer', async () => {
	vi.stubEnv('NODE_ENV', 'production'); const { deps, context } = signupFixture();
	await call(createSignupProcedure(deps), { username: 'alice', password: 'synthetic-password', host: 'synthetic.example.invalid' }, { context });
	expect(deps.signupService.signup).toHaveBeenCalledWith(expect.objectContaining({ host: null }));
	expect(deps.browserSessionService.issueForNewAccount).toHaveBeenCalledWith(account);
});
