/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { call } from '@orpc/server';
import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createI2faPasswordLessProcedure } from '../../backend/endpoints/i/2fa/password-less.js';
import { createI2faUpdateKeyProcedure } from '../../backend/endpoints/i/2fa/update-key.js';
import { createIDeleteAccountProcedure } from '@features/users/backend/endpoints/i/delete-account.js';
import { assertLegacyMfaManagement, assertSameMfaPolicy } from '../../backend/mfa-policy.js';
import { testContext } from './native-context.js';

const me = mockDeep<MiLocalUser>({ id: 'synthetic-user', isSuspended: false, isDeleted: false, host: null });
function browserContext() {
	const context = testContext(me);
	context.services.authenticate = async () => [me, null, { id: 'synthetic-session', userId: me.id }];
	return context;
}
test('browser sessions cannot bypass sudo through the old passwordless toggle or key rename', async () => {
	const passwordless = mockDeep<Parameters<typeof createI2faPasswordLessProcedure>[0]>();
	const rename = mockDeep<Parameters<typeof createI2faUpdateKeyProcedure>[0]>();
	await expect(call(createI2faPasswordLessProcedure(passwordless), { value: false }, { context: browserContext() })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
	await expect(call(createI2faUpdateKeyProcedure(rename), { credentialId: 'AQID', name: 'Changed' }, { context: browserContext() })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
	expect(passwordless.userProfilesRepository.findOneByOrFail).not.toHaveBeenCalled(); expect(rename.db.transaction).not.toHaveBeenCalled();
});
test('old deletion never invokes the unlocked external-effects writer', async () => {
	const deps = mockDeep<Parameters<typeof createIDeleteAccountProcedure>[0]>();
	for (const context of [browserContext()]) {
		await expect(call(createIDeleteAccountProcedure(deps), { password: 'synthetic' }, { context })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
	}
	expect(deps.deleteAccountService.deleteAccount).not.toHaveBeenCalled();
});
test('legacy proofs reject disabled-password policy and changed primary login flags', () => {
	const before = { userId: me.id, password: 'synthetic-hash', twoFactorEnabled: false, twoFactorSecret: null, passkeyMfaEnabled: false, usePasswordLessLogin: false, passwordLoginDisabled: false };
	expect(() => assertLegacyMfaManagement({ ...before, passwordLoginDisabled: true })).toThrow();
	expect(() => assertSameMfaPolicy(before, { ...before, usePasswordLessLogin: true })).toThrow();
	expect(() => assertSameMfaPolicy(before, { ...before, passwordLoginDisabled: true })).toThrow();
});
