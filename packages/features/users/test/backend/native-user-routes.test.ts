/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { packedMeDetailedOnlySchema } from '../../backend/user.schema.js';
import { IOperation } from '../../backend/endpoints/i.js';
import { UsersShowOperation } from '../../backend/endpoints/users/show.js';
import { usersShowInput } from '../../backend/endpoints/users/show.contract.js';
import { iUpdateInput } from '../../backend/endpoints/i/update.contract.js';
import { packedUsersInput } from '../../backend/endpoints/users.contract.js';
import type { MiLocalUser, MiRemoteUser } from '../../backend/models/User.js';
import type { MiUserProfile } from '../../backend/models/UserProfile.js';
import type { UserEntityService } from '../../backend/serializers/UserEntityService.js';
import type { NativeMeDetailed } from '../../backend/serializers/native-user.js';
import type { UsersRepository, UserProfilesRepository, MiMeta } from '@features/persistence/backend/repositories/models.js';
import type { RemoteUserResolveService } from '@features/federation/backend/services/RemoteUserResolveService.js';
import type { RoleService } from '@features/roles/backend/services/RoleService.js';
import type { PerUserPvChart } from '@features/statistics/backend/charts/per-user-pv.js';
import type { ApiLoggerService } from '@features/api/backend/transport/ApiLoggerService.js';

function showFixture() {
	const settings = mockDeep<MiMeta>();
	const repository = mockDeep<UsersRepository>();
	const serializer = mockDeep<UserEntityService>();
	const remote = mockDeep<RemoteUserResolveService>();
	const roles = mockDeep<RoleService>();
	roles.isModerator.mockResolvedValue(false);
	const operation = new UsersShowOperation(settings, repository, serializer, remote, roles, mockDeep<PerUserPvChart>(), mockDeep<ApiLoggerService>());
	return { settings, repository, serializer, remote, operation };
}

test('users/show preserves competing selectors and prioritizes a present userIds array', async () => {
	const input = { userIds: [], userId: 'local1', username: 'alice', host: 'remote.example' };
	const parsed = v.parse(usersShowInput, input);
	expect(parsed).toEqual(input);
	const fixture = showFixture();
	expect(await fixture.operation.execute(parsed, null, null, '127.0.0.1')).toEqual([]);
	expect(fixture.repository.findOneBy).not.toHaveBeenCalled();
	expect(fixture.remote.resolveUser).not.toHaveBeenCalled();
});

test('users/show respects live visitor settings before resolving a remote account', async () => {
	const fixture = showFixture();
	const input = v.parse(usersShowInput, { username: 'alice', host: 'remote.example' });
	fixture.settings.ugcVisibilityForVisitor = 'local';
	await expect(fixture.operation.execute(input, null, null, '127.0.0.1')).rejects.toMatchObject({ code: 'NO_SUCH_USER', status: 404 });
	expect(fixture.remote.resolveUser).not.toHaveBeenCalled();
	fixture.settings.ugcVisibilityForVisitor = 'none';
	fixture.remote.resolveUser.mockResolvedValue(mockDeep<MiRemoteUser>({ id: 'remote1', host: 'remote.example', uri: 'https://remote.example/users/remote1', isSuspended: false }));
	await fixture.operation.execute(input, null, null, '127.0.0.1');
	expect(fixture.remote.resolveUser).toHaveBeenCalledWith('alice', 'remote.example');
});

test('i includes self secrets only for a native session', async () => {
	const profiles = mockDeep<UserProfilesRepository>();
	const serializer = mockDeep<UserEntityService>();
	const actor = mockDeep<MiLocalUser>({ id: 'local1', host: null, uri: null });
	profiles.findOne.mockResolvedValue(mockDeep<MiUserProfile>({ user: actor, loggedInDates: [] }));
	serializer.packSelf.mockResolvedValue(mockDeep<NativeMeDetailed>());
	const operation = new IOperation(profiles, serializer);
	await operation.execute({}, actor, { id: 'app1', permission: ['read:account'] }, '127.0.0.1');
	expect(serializer.packSelf).toHaveBeenLastCalledWith(actor, expect.objectContaining({ includeSecrets: false }));
	await operation.execute({}, actor, null, '127.0.0.1');
	expect(serializer.packSelf).toHaveBeenLastCalledWith(actor, expect.objectContaining({ includeSecrets: true }));
});

test('native user inputs retain defaults, Unicode name bounds, nullable fields and duplicate rejection', () => {
	expect(v.parse(packedUsersInput, {})).toEqual({ limit: 10, offset: 0, state: 'all', origin: 'local', hostname: null });
	expect(v.parse(iUpdateInput, { name: '😀'.repeat(50), description: null, birthday: '2026-10-09' }).name).toHaveLength(100);
	expect(v.safeParse(iUpdateInput, { name: '😀'.repeat(51) }).success).toBe(false);
	expect(v.safeParse(usersShowInput, { userIds: ['same', 'same'] }).success).toBe(false);
	expect(v.safeParse(usersShowInput, {}).success).toBe(false);
});

test('i/update retains future notification JSON keys alongside validated named rules', () => {
	const settings = { login: { type: 'never' }, createToken: { type: 'all' }, exportCompleted: { type: 'following' }, futureNotification: { enabled: true, channels: ['web', null], options: { rate: 2 } } };
	expect(v.parse(iUpdateInput, { notificationRecieveConfig: settings }).notificationRecieveConfig).toEqual(settings);
	expect(v.safeParse(iUpdateInput, { notificationRecieveConfig: { login: { type: 'invalid' } } }).success).toBe(false);
	expect(v.parse(iUpdateInput, { notificationRecieveConfig: { note: undefined, futureNotification: true } }).notificationRecieveConfig).toEqual({ futureNotification: true });
	expect(v.safeParse(iUpdateInput, { notificationRecieveConfig: { futureNotification: undefined } }).success).toBe(false);
});

test('notification settings retain reserved JSON keys and reject invalid reserved values', () => {
	const validRule = { type: 'all' };
	const settings = { note: validRule };
	for (const key of ['__proto__', 'constructor', 'prototype']) {
		Object.defineProperty(settings, key, { value: { future: true }, enumerable: true });
		Object.defineProperty(validRule, key, { value: { enabled: true }, enumerable: true });
	}
	expect(v.parse(iUpdateInput, { notificationRecieveConfig: settings }).notificationRecieveConfig).toEqual(settings);
	expect(v.parse(packedMeDetailedOnlySchema.entries.notificationRecieveConfig, settings)).toEqual(settings);
	for (const key of ['__proto__', 'constructor', 'prototype']) {
		const invalid: { [key: string]: number } = {};
		Object.defineProperty(invalid, key, { value: Number.POSITIVE_INFINITY, enumerable: true });
		expect(v.safeParse(iUpdateInput, { notificationRecieveConfig: invalid }).success).toBe(false);
		expect(v.safeParse(packedMeDetailedOnlySchema.entries.notificationRecieveConfig, invalid).success).toBe(false);
		const rule = { type: 'all' };
		Object.defineProperty(rule, key, { value: Number.POSITIVE_INFINITY, enumerable: true });
		expect(v.safeParse(iUpdateInput, { notificationRecieveConfig: { note: rule } }).success).toBe(false);
		expect(v.safeParse(packedMeDetailedOnlySchema.entries.notificationRecieveConfig, { note: rule }).success).toBe(false);
	}
});
