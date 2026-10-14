/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { call } from '@orpc/server';
import bcrypt from 'bcryptjs';
import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';
import { createI2faRemoveKeyProcedure } from '../../backend/endpoints/i/2fa/remove-key.js';
import { createI2faUnregisterProcedure } from '../../backend/endpoints/i/2fa/unregister.js';
import { createAdminUnsetMfaProcedure } from '../../backend/endpoints/admin/unset-mfa.js';
import { testContext } from './native-context.js';
import type { DataSource, EntityManager } from 'typeorm';
import type { UserProfilesRepository, UserSecurityKeysRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

function fixture() {
	const me = mockDeep<MiLocalUser>({ id: '0000000000000001', isSuspended: false, isDeleted: false, movedToUri: null });
	const profile = mockDeep<MiUserProfile>({ userId: me.id, password: bcrypt.hashSync('synthetic-password', 4), twoFactorEnabled: true, twoFactorSecret: 'synthetic-secret', twoFactorBackupSecret: ['synthetic-recovery'], passkeyMfaEnabled: false });
	const profiles = mockDeep<UserProfilesRepository>();
	profiles.findOneByOrFail.mockResolvedValue(profile);
	profiles.findOneOrFail.mockResolvedValue(profile);
	const keys = mockDeep<UserSecurityKeysRepository>();
	keys.count.mockResolvedValue(0);
	const manager = mockDeep<EntityManager>();
	manager.getRepository.mockImplementation(entity => {
		if (entity === MiUserProfile) return profiles as unknown as ReturnType<EntityManager['getRepository']>;
		if (entity === MiUserSecurityKey) return keys as unknown as ReturnType<EntityManager['getRepository']>;
		throw new Error('unsupported synthetic repository');
	});
	const db = mockDeep<DataSource>();
	db.transaction.mockImplementation(async (...args) => {
		const callback = args.at(-1);
		if (typeof callback !== 'function') throw new Error('missing synthetic transaction callback');
		return await callback(manager);
	});
	const events = mockDeep<Parameters<typeof createI2faRemoveKeyProcedure>[0]['globalEventService']>();
	const auth = mockDeep<Parameters<typeof createI2faRemoveKeyProcedure>[0]['userAuthService']>();
	const deps = { db, userProfilesRepository: profiles, userSecurityKeysRepository: keys, userAuthService: auth, userEntityService: mockDeep<Parameters<typeof createI2faRemoveKeyProcedure>[0]['userEntityService']>(), globalEventService: events };
	const remove = createI2faRemoveKeyProcedure(deps);
	const unregister = createI2faUnregisterProcedure(deps);
	return { me, profile, profiles, keys, manager, db, events, auth,
		invoke: (action: 'key' | 'totp') => action === 'key'
			? call(remove, { password: 'synthetic-password', token: 'synthetic-recovery', credentialId: 'synthetic-key' }, { context: testContext(me) })
			: call(unregister, { password: 'synthetic-password', token: 'synthetic-recovery' }, { context: testContext(me) }),
	};
}

test.each(['key', 'totp'] as const)('independent policy blocks legacy %s management without consuming its shared recovery code', async action => {
	const h = fixture(); h.profile.passkeyMfaEnabled = true;
	await expect(h.invoke(action)).rejects.toThrow('authentication failed');
	expect(h.auth.twoFactorAuthenticate).not.toHaveBeenCalled();
	expect(h.db.transaction).not.toHaveBeenCalled();
	expect(h.keys.delete).not.toHaveBeenCalled();
	expect(h.profiles.update).not.toHaveBeenCalled();
	expect(h.events.publishMainStream).not.toHaveBeenCalled();
});

test.each(['key', 'totp'] as const)('stale %s proof cannot mutate a changed policy after acquiring the common row lock', async action => {
	const h = fixture(); h.profiles.findOneOrFail.mockResolvedValue({ ...h.profile, password: 'changed-synthetic-hash' });
	await expect(h.invoke(action)).rejects.toThrow('authentication failed');
	expect(h.auth.twoFactorAuthenticate).toHaveBeenCalledOnce();
	expect(h.profiles.findOneOrFail).toHaveBeenCalledWith({ where: { userId: h.me.id }, lock: { mode: 'pessimistic_write' } });
	expect(h.keys.delete).not.toHaveBeenCalled();
	expect(h.profiles.update).not.toHaveBeenCalled();
	expect(h.events.publishMainStream).not.toHaveBeenCalled();
});

test.each(['key', 'totp'] as const)('valid legacy %s management preserves proof-before-lock and event-after-commit ordering', async action => {
	const h = fixture(); await h.invoke(action);
	expect(h.auth.twoFactorAuthenticate.mock.invocationCallOrder[0]).toBeLessThan(h.db.transaction.mock.invocationCallOrder[0]);
	expect(h.profiles.findOneOrFail.mock.invocationCallOrder[0]).toBeLessThan(h.profiles.update.mock.invocationCallOrder[0]);
	expect(h.profiles.update.mock.invocationCallOrder[0]).toBeLessThan(h.events.publishMainStream.mock.invocationCallOrder[0]);
	if (action === 'totp') expect(h.profiles.update).toHaveBeenCalledWith({ userId: h.me.id }, { twoFactorSecret: null, twoFactorBackupSecret: null, twoFactorEnabled: false, usePasswordLessLogin: false, passkeyMfaEnabled: false });
	else expect(h.keys.delete).toHaveBeenCalledWith({ userId: h.me.id, id: 'synthetic-key' });
});

test('admin recovery without a password leaves factors and audit log untouched', async () => {
	const h = fixture(); h.profile.password = null; h.profile.passkeyMfaEnabled = true;
	const users = mockDeep<Parameters<typeof createAdminUnsetMfaProcedure>[0]['usersRepository']>(); users.findOneBy.mockResolvedValue(h.me);
	const roles = mockDeep<Parameters<typeof createAdminUnsetMfaProcedure>[0]['roleService']>(); roles.isAdministrator.mockResolvedValue(false);
	const logs = mockDeep<Parameters<typeof createAdminUnsetMfaProcedure>[0]['moderationLogService']>();
	const endpoint = createAdminUnsetMfaProcedure({ db: h.db, usersRepository: users, roleService: roles, moderationLogService: logs });
	await expect(call(endpoint, { userId: h.me.id }, { context: testContext(h.me) })).rejects.toThrow('authentication failed');
	expect(h.manager.delete).not.toHaveBeenCalled();
	expect(h.manager.update).not.toHaveBeenCalled();
	expect(logs.log).not.toHaveBeenCalled();
});
