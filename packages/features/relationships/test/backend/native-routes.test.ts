/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { call } from '@orpc/server';
import * as v from 'valibot';
import { createRelationshipsRouter } from '../../backend/endpoints/relationships.js';
import { relationshipsContract } from '../../backend/endpoints/relationships.contract.js';
import { readBirthdayDate } from '../../backend/endpoints/birthday.schema.js';
import { packedUserRelationSchema } from '../../backend/endpoints/relationships.schema.js';
import type { MiLocalUser } from '../../../users/backend/models/User.js';
import type { RelationshipsDependencies } from '../../backend/api.dependencies.js';
import type { ApiContext, ApiServices } from '../../../api/backend/transport/context.js';

function requiredSchema<S extends v.GenericSchema>(schema: S | undefined): S {
	if (schema === undefined) throw new Error('Missing native schema');
	return schema;
}

const packedBlockingListInput = requiredSchema(relationshipsContract['blocking/list']['~orpc'].inputSchema);
const allOfUsersFollowersInput = requiredSchema(relationshipsContract['users/followers']['~orpc'].inputSchema);
const unionUsersRelationInput = requiredSchema(relationshipsContract['users/relation']['~orpc'].inputSchema);
const birthdayInput = requiredSchema(relationshipsContract['users/get-following-users-by-birthday']['~orpc'].inputSchema);

function parseBirthday(value: unknown) { return v.parse(birthdayInput, { birthday: value }).birthday; }

function validBirthday(value: unknown) { return v.safeParse(birthdayInput, { birthday: value }).success; }

const actor = mockDeep<MiLocalUser>({ id: 'actor123', isSuspended: false, movedToUri: null });

function harness(principal: MiLocalUser | null = actor) {
	const services = mockDeep<ApiServices<MiLocalUser>>();
	services.authenticate.mockResolvedValue([principal, null]);
	services.limitActor.mockReturnValue('actor123');
	services.rateLimitFactor.mockResolvedValue(1);
	services.limit.mockResolvedValue(null);
	const deps = mockDeep<RelationshipsDependencies>();
	const context: ApiContext<MiLocalUser> = { services, credential: null, ip: '127.0.0.1', headers: {} };
	return { services, deps, context, router: createRelationshipsRouter<MiLocalUser>(deps) };
}

test('all 36 routes use finite native contracts and preserve pagination/selector inputs', () => {
	expect(Object.keys(relationshipsContract)).toHaveLength(36);
	expect(v.parse(packedBlockingListInput, { future: true })).toEqual({ limit: 30 });
	expect(v.parse(allOfUsersFollowersInput, { username: 'alice', host: null })).toEqual({ username: 'alice', host: null, limit: 10 });
	expect(v.parse(allOfUsersFollowersInput, { userId: 'user123', username: 'inactive', host: null })).toEqual({ userId: 'user123', limit: 10 });
	expect(v.parse(unionUsersRelationInput, { userId: [] })).toEqual({ userId: [] });
	for (const value of [null, [], { limit: 0 }, { limit: '30' }]) expect(v.safeParse(packedBlockingListInput, value).success).toBe(false);
});

test('rate limits precede credential denial and protected commands never execute anonymously', async () => {
	const h = harness(null);
	await expect(call(h.router['blocking/create'], { userId: 'user123' }, { context: h.context })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED', data: { id: '1384574d-a912-4b81-8601-c7b1c4085df1' } });
	expect(h.services.limit).toHaveBeenCalledWith({ key: 'blocking/create', duration: 3600000, max: 20 }, 'actor123', 1);
	expect(h.deps.usersRepository.findOneByOrFail).not.toHaveBeenCalled();
});

test('moved-account and token scopes retain public error identities before commands execute', async () => {
	const moved = harness({ ...actor, movedToUri: 'https://example.com/new' });
	await expect(call(moved.router['following/create'], { userId: 'user123' }, { context: moved.context })).rejects.toMatchObject({ code: 'YOUR_ACCOUNT_MOVED', data: { id: '56f20ec9-fd06-4fa5-841b-edd6d7d4fa31' } });
	expect(moved.deps.getterService.getUser).not.toHaveBeenCalled();
	const scoped = harness();
	scoped.services.authenticate.mockResolvedValue([actor, { permission: ['read:following'] }]);
	await expect(call(scoped.router['following/create'], { userId: 'user123' }, { context: scoped.context })).rejects.toMatchObject({ code: 'PERMISSION_DENIED', data: { id: '1370e5b7-d4eb-4566-bb1d-7748ee6a1838' } });
	expect(scoped.deps.getterService.getUser).not.toHaveBeenCalled();
});

test('public list lookups accept anonymous viewers and closed outputs reject drift', async () => {
	const h = harness(null);
	h.deps.usersRepository.findOneBy.mockResolvedValue(mockDeep<MiLocalUser>({ id: 'user123', host: null }));
	h.deps.userListsRepository.findBy.mockResolvedValue([]);
	expect(await call(h.router['users/lists/list'], { userId: 'user123' }, { context: h.context })).toEqual([]);
	expect(h.deps.userListsRepository.findBy).toHaveBeenCalledWith({ userId: 'user123', isPublic: true });
	const relation = { id: 'user123', following: null, isFollowing: false, isFollowed: false, hasPendingFollowRequestFromYou: false, hasPendingFollowRequestToYou: false, isBlocking: false, isBlocked: false, isMuted: false, isRenoteMuted: false };
	expect(v.parse(packedUserRelationSchema, relation)).toEqual(relation);
	expect(v.safeParse(packedUserRelationSchema, { ...relation, future: true }).success).toBe(false);
});

test('birthday remains exclusive while inactive JSON range keys retain consumer failure behavior', () => {
	expect(parseBirthday({ month: 1, day: 2 })).toEqual({ month: 1, day: 2 });
	expect(parseBirthday({ begin: { month: 12, day: 31 }, end: { month: 1, day: 1 } })).toEqual({ begin: { month: 12, day: 31 }, end: { month: 1, day: 1 } });
	expect(validBirthday({ month: 1, day: 2, begin: { month: 2, day: 3 }, end: { month: 4, day: 5 } })).toBe(false);
	const inactive = parseBirthday({ month: 1, day: 2, begin: 'malformed', end: null });
	expect(inactive).toEqual({ month: 1, day: 2, begin: 'malformed', end: null });
	if ('begin' in inactive) expect(() => readBirthdayDate(inactive.begin)).toThrow(TypeError);
});
