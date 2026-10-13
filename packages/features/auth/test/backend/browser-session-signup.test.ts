/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { call } from '@orpc/server';
import { expect, test } from 'vitest';
import { mock, mockDeep } from 'vitest-mock-extended';
import type { MiUserPending, MiUserProfile } from '../../../persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../users/backend/models/User.js';
import type { AuthSessionContext } from '../../backend/session.effects.js';
import { createSignupProcedure } from '../../backend/endpoints/signup.js';
import type { SignupDependencies } from '../../backend/endpoints/signup.js';
import { createSignupPendingProcedure } from '../../backend/endpoints/signupPending.js';
import type { SignupPendingDependencies } from '../../backend/endpoints/signupPending.js';
import { createAdminAccountsCreateProcedure } from '../../backend/endpoints/admin/accounts/create.js';
import type { AdminAccountsCreateDependencies } from '../../backend/endpoints/admin/accounts/create.js';
import { testContext } from './native-context.js';

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
	deps.signupService.signup.mockResolvedValue({ account, secret: 'legacy-master' });
	deps.userEntityService.packSelf.mockResolvedValue(packedSelf());
	deps.browserSessionService.issue.mockResolvedValue(session);
	const context: AuthSessionContext = { request: { ip: '127.0.0.1', headers: {} }, effects: mockDeep(), response: {} };
	return { deps, context };
}

test('ordinary signup returns its new browser credential, never the legacy master', async () => {
	const { deps, context } = signupFixture();
	const result = await call(createSignupProcedure(deps), { username: 'alice', password: 'synthetic-password' }, { context });
	expect(result?.token).toBe('bs_synthetic');
	expect(deps.browserSessionService.issue).toHaveBeenCalledWith('alice');
	expect(deps.browserSessionService.issue.mock.invocationCallOrder[0]).toBeGreaterThan(deps.signupService.signup.mock.invocationCallOrder[0]);
});

test('failed signup session insert never returns the legacy credential as a fallback', async () => {
	const { deps, context } = signupFixture();
	deps.browserSessionService.issue.mockRejectedValue(new Error('synthetic insert failure'));
	await expect(call(createSignupProcedure(deps), { username: 'alice', password: 'synthetic-password' }, { context })).rejects.toThrow();
});

test('admin account creation returns an individual browser credential after existing setup checks', async () => {
	const deps = mockDeep<AdminAccountsCreateDependencies>();
	deps.config.setupPassword = 'synthetic-setup';
	deps.serverSettings.rootUserId = null;
	deps.signupService.signup.mockResolvedValue({ account, secret: 'legacy-master' });
	deps.userEntityService.packSelf.mockResolvedValue(packedSelf());
	deps.browserSessionService.issue.mockResolvedValue(session);
	const result = await call(createAdminAccountsCreateProcedure(deps), { username: 'alice', password: 'synthetic-password', setupPassword: 'synthetic-setup' }, { context: testContext(null) });
	expect(result.token).toBe('bs_synthetic');
	expect(deps.browserSessionService.issue).toHaveBeenCalledOnce();
});

test('invalid initial setup never creates an account or browser session', async () => {
	const deps = mockDeep<AdminAccountsCreateDependencies>();
	deps.config.setupPassword = 'synthetic-setup';
	deps.serverSettings.rootUserId = null;
	await expect(call(createAdminAccountsCreateProcedure(deps), { username: 'alice', password: 'synthetic-password', setupPassword: 'wrong' }, { context: testContext(null) })).rejects.toThrow();
	expect(deps.signupService.signup).not.toHaveBeenCalled();
	expect(deps.browserSessionService.issue).not.toHaveBeenCalled();
});

test('pending signup awaits the shared signin issuer exactly once', async () => {
	const deps = mockDeep<SignupPendingDependencies>();
	deps.userPendingsRepository.findOneByOrFail.mockResolvedValue(mockDeep<MiUserPending>({ id: 'pending1', username: 'alice', password: 'hashed-synthetic', email: 'alice@example.test' }));
	deps.idService.parse.mockReturnValue({ date: new Date() });
	deps.signupService.signup.mockResolvedValue({ account, secret: 'legacy-master' });
	deps.userProfilesRepository.findOneByOrFail.mockResolvedValue(mockDeep<MiUserProfile>({ userId: 'alice' }));
	deps.registrationTicketsRepository.findOneBy.mockResolvedValue(null);
	deps.signinService.signin.mockResolvedValue({ finished: true, id: 'alice', i: 'bs_synthetic' });
	const context: AuthSessionContext = { request: { ip: '127.0.0.1', headers: {} }, effects: mockDeep(), response: {} };
	expect(await call(createSignupPendingProcedure(deps), { code: 'synthetic-code' }, { context })).toEqual({ finished: true, id: 'alice', i: 'bs_synthetic' });
	expect(deps.signinService.signin).toHaveBeenCalledOnce();
});
