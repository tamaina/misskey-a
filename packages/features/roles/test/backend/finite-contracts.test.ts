/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { Brackets } from 'typeorm';
import * as p from '../../contract/packed-endpoint-definitions.js';
import * as q from '../../contract/void-endpoint-definitions.js';
import * as r from '../../contract/reference-endpoint-definitions.js';
import { packedRoleSchema } from '../../contract/packed.js';
import { EndpointImplementation as UsersEndpoint } from '../../backend/endpoints/roles/users.js';
import { EndpointImplementation as AdminUsersEndpoint } from '../../backend/endpoints/admin/roles/users.js';
import { EndpointImplementation as ShowEndpoint } from '../../backend/endpoints/roles/show.js';
import { EndpointImplementation as ListEndpoint } from '../../backend/endpoints/roles/list.js';
import { RoleEntityService } from '../../backend/serializers/RoleEntityService.js';
import { DEFAULT_POLICIES } from '../../backend/services/RoleService.js';
import type { MiRole } from '../../backend/models/Role.js';
import type { MiRoleAssignment } from '../../backend/models/RoleAssignment.js';
import type { RolesRepository, RoleAssignmentsRepository } from '@features/persistence/backend/repositories/models.js';
import type { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { Packed } from '@features/index/contract/packed.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import { projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { getJsonObjectSchemaRegistration } from '@features/api/contract/json-object.js';

const date = new Date('2026-01-02T03:04:05.000Z');
const user = {
	id: 'user123', name: null, username: 'member', host: null,
	avatarUrl: 'https://example.test/avatar.png', avatarBlurhash: null, avatarDecorations: [], emojis: {}, onlineStatus: 'unknown',
	url: null, uri: null, movedTo: null, alsoKnownAs: null, createdAt: date.toISOString(), updatedAt: null, lastFetchedAt: null,
	bannerUrl: null, bannerBlurhash: null, isLocked: false, isSilenced: false, isSuspended: false,
	description: null, location: null, birthday: null, lang: null, fields: [], verifiedLinks: [],
	followersCount: 0, followingCount: 0, notesCount: 0, pinnedNoteIds: [], pinnedNotes: [], pinnedPageId: null, pinnedPage: null,
	publicReactions: false, followingVisibility: 'public', followersVisibility: 'public', chatScope: 'everyone', canChat: true, roles: [], memo: null,
} satisfies Packed<'UserDetailedNotMe'>;
const create = {
	name: 'role', description: '', color: null, iconUrl: null, target: 'manual', condFormula: { future: { nested: true } },
	isPublic: true, isModerator: false, isAdministrator: false, asBadge: false, canEditMembersByModerator: false,
	displayOrder: 0.5, policies: { custom: { value: ['image/*'], extension: true } },
} satisfies v.InferInput<typeof p.packedAdminRolesCreateInput>;

test('all eleven finite inputs strip unknown outer fields while preserving defaults and validators', () => {
	const cases = [
		[p.packedAdminRolesListInput, {}, {}],
		[p.packedAdminRolesShowInput, { roleId: 'role123' }, { roleId: 'role123' }],
		[p.packedRolesListInput, {}, {}],
		[p.packedRolesNotesInput, { roleId: 'role123' }, { roleId: 'role123', limit: 10 }],
		[p.packedRolesShowInput, { roleId: 'role123' }, { roleId: 'role123' }],
		[p.packedRolesUsersInput, { roleId: 'role123' }, { roleId: 'role123', limit: 10 }],
		[q.voidAdminRolesAssignInput, { roleId: 'role123', userId: 'user123', expiresAt: null }, { roleId: 'role123', userId: 'user123', expiresAt: null }],
		[q.voidAdminRolesDeleteInput, { roleId: 'role123' }, { roleId: 'role123' }],
		[q.voidAdminRolesUnassignInput, { roleId: 'role123', userId: 'user123' }, { roleId: 'role123', userId: 'user123' }],
		[q.voidAdminRolesUpdateInput, { roleId: 'role123', color: null, displayOrder: 0.5 }, { roleId: 'role123', color: null, displayOrder: 0.5 }],
		[q.voidAdminRolesUpdateDefaultPoliciesInput, { policies: create.policies }, { policies: create.policies }],
	] as const;
	expect(cases).toHaveLength(11);
	for (const [schema, input, output] of cases) {
		expect(schema.type).toBe('object');
		expect(v.parse(schema, { ...input, i: 'transport', future: true })).toEqual(output);
		expect(toLegacyJsonSchema(schema, { typeMode: 'input' }).additionalProperties).toBeUndefined();
	}
	for (const schema of [p.packedAdminRolesListInput, p.packedRolesListInput]) {
		for (const input of [[], ['legacy'], { future: true }]) expect(v.parse(schema, input)).toEqual({});
		for (const input of [null, undefined, 1, 'object']) expect(v.safeParse(schema, input).success).toBe(false);
	}
	for (const schema of [p.packedRolesNotesInput, p.packedRolesUsersInput, r.referenceAdminRolesUsersInput]) {
		for (const input of [{}, { roleId: 'bad-id' }, { roleId: 'role123', limit: 0 }, { roleId: 'role123', limit: 101 }, { roleId: 'role123', limit: 1.5 }, { roleId: 'role123', sinceDate: 1.5 }]) {
			expect(v.safeParse(schema, input).success).toBe(false);
		}
	}
	expect(v.safeParse(q.voidAdminRolesAssignInput, { roleId: 'role123', userId: 'user123', expiresAt: 1.5 }).success).toBe(false);
	expect(v.parse(q.voidAdminRolesAssignInput, { roleId: 'role123', userId: 'user123' })).toEqual({ roleId: 'role123', userId: 'user123' });
	expect(v.parse(q.voidAdminRolesAssignInput, { roleId: 'role123', userId: 'user123', expiresAt: 42 })).toEqual({ roleId: 'role123', userId: 'user123', expiresAt: 42 });
	expectTypeOf<v.InferOutput<typeof p.packedRolesShowInput>>().toEqualTypeOf<{ roleId: string }>();
});

test('two registered JSON-object inputs retain exact registration and opaque stored extensions', () => {
	for (const schema of [p.packedAdminRolesCreateInput, r.referenceAdminRolesUsersInput]) expect(getJsonObjectSchemaRegistration(schema)).toBeDefined();
	expect(v.parse(p.packedAdminRolesCreateInput, { ...create, future: true })).toEqual({ ...create, isExplorable: false, future: true });
	expect(v.parse(r.referenceAdminRolesUsersInput, { roleId: 'role123', future: true })).toEqual({ roleId: 'role123', limit: 10, future: true });
	expect(v.parse(q.voidAdminRolesUpdateInput, { roleId: 'role123', condFormula: create.condFormula, policies: create.policies, future: true })).toEqual({ roleId: 'role123', condFormula: create.condFormula, policies: create.policies });
	for (const field of ['condFormula', 'policies']) {
		expect(v.safeParse(p.packedAdminRolesCreateInput, { ...create, [field]: [] }).success).toBe(false);
		expect(v.safeParse(q.voidAdminRolesUpdateInput, { roleId: 'role123', [field]: null }).success).toBe(false);
	}
});

test('two strict assignment envelopes reject extra, missing and wrong outer fields; nested reference remains open', () => {
	const member = { id: 'assign123', user: { ...user, future: true } };
	const admin = { ...member, createdAt: date.toISOString(), expiresAt: null };
	expect(v.parse(p.packedRolesUsersOutput, [member])).toEqual([member]);
	expect(v.parse(r.referenceAdminRolesUsersOutput, [admin])).toEqual([admin]);
	expect(v.parse(r.referenceAdminRolesUsersOutput, [{ ...admin, expiresAt: date.toISOString() }])).toEqual([{ ...admin, expiresAt: date.toISOString() }]);
	for (const output of [p.packedRolesUsersOutput, r.referenceAdminRolesUsersOutput]) {
		const item = output === p.packedRolesUsersOutput ? member : admin;
		for (const invalid of [{ ...item, future: true }, { ...item, id: 7 }, { id: item.id }, { ...item, user: null }]) expect(v.safeParse(output, [invalid]).success).toBe(false);
	}
	for (const invalid of [member, { ...admin, createdAt: null }, { ...admin, expiresAt: 42 }]) expect(v.safeParse(r.referenceAdminRolesUsersOutput, [invalid]).success).toBe(false);
	expect(projectEndpointContract(r.referenceAdminRolesUsersDefinition).response).toMatchObject({ items: { additionalProperties: false, properties: { user: { ref: 'UserDetailed' } } } });
	const response = projectEndpointContract(r.referenceAdminRolesUsersDefinition).response;
	expect(response?.items?.properties?.user).not.toHaveProperty('type');
});

test.each([null, date])('actual assignment handlers serialize dates, expiry=%s, users and visibility filters', async expiresAt => {
	const roles = mockDeep<RolesRepository>();
	const assigns = mockDeep<RoleAssignmentsRepository>();
	const query = mockDeep<ReturnType<RoleAssignmentsRepository['createQueryBuilder']>>();
	const pagination = mockDeep<QueryService>();
	const users = mockDeep<UserEntityService>();
	const ids = mockDeep<IdService>();
	const role = mockDeep<MiRole>({ id: 'role123' });
	const actor = mockDeep<MiLocalUser>({ id: 'actor123' });
	const assignment = mockDeep<MiRoleAssignment>({ id: 'assign123', userId: user.id, roleId: role.id, user: null, expiresAt });
	roles.findOneBy.mockResolvedValue(role);
	assigns.createQueryBuilder.mockReturnValue(query);
	pagination.makePaginationQuery.mockReturnValue(query);
	query.andWhere.mockReturnValue(query);
	query.innerJoinAndSelect.mockReturnValue(query);
	query.limit.mockReturnValue(query);
	query.getMany.mockResolvedValue([assignment]);
	users.packMany.mockResolvedValue([user]);
	ids.parse.mockReturnValue({ date });
	const publicEndpoint = new UsersEndpoint(roles, assigns, pagination, users);
	const publicResult = await publicEndpoint.exec({ roleId: role.id }, actor, null);
	expect(publicResult).toEqual([{ id: assignment.id, user }]);
	expect(v.parse(p.packedRolesUsersOutput, publicResult)).toEqual(publicResult);
	expect(roles.findOneBy).toHaveBeenLastCalledWith({ id: role.id, isPublic: true, isExplorable: true });
	const adminEndpoint = new AdminUsersEndpoint(roles, assigns, pagination, users, ids);
	const adminResult = await adminEndpoint.exec({ roleId: role.id }, actor, null);
	expect(adminResult).toEqual([{ id: assignment.id, createdAt: date.toISOString(), user, expiresAt: expiresAt?.toISOString() ?? null }]);
	expect(v.parse(r.referenceAdminRolesUsersOutput, adminResult)).toEqual(adminResult);
	expect(roles.findOneBy).toHaveBeenLastCalledWith({ id: role.id });
	expect(users.packMany).toHaveBeenCalledWith([user.id], actor, { schema: 'UserDetailed' });
	expect(query.limit).toHaveBeenCalledWith(10);
	const bracket = query.andWhere.mock.calls.find(([condition]) => condition instanceof Brackets)?.[0];
	expect(bracket).toBeInstanceOf(Brackets);
	if (!(bracket instanceof Brackets)) throw new Error('Missing active-assignment filter');
	const predicate = mockDeep<Parameters<Brackets['whereFactory']>[0]>();
	predicate.where.mockReturnValue(predicate);
	predicate.orWhere.mockReturnValue(predicate);
	bracket.whereFactory(predicate);
	expect(predicate.where).toHaveBeenCalledWith('assign.expiresAt IS NULL');
	expect(predicate.orWhere).toHaveBeenCalledWith('assign.expiresAt > :now', { now: expect.any(Date) });
	// Missing batch entries use the existing per-user serializer fallback.
	users.packMany.mockResolvedValue([]);
	users.pack.mockResolvedValue(user);
	assignment.user = actor;
	expect(await publicEndpoint.exec({ roleId: role.id }, actor, null)).toEqual(publicResult);
	expect(users.pack).toHaveBeenCalledWith(actor, actor, { schema: 'UserDetailed' });
	roles.findOneBy.mockResolvedValue(null);
	await expect(publicEndpoint.exec({ roleId: role.id }, actor, null)).rejects.toMatchObject({ code: 'NO_SUCH_ROLE' });
	await expect(adminEndpoint.exec({ roleId: role.id }, actor, null)).rejects.toMatchObject({ code: 'NO_SUCH_ROLE' });
});

test('real Role serializer retains stored extensions and producer policy defaults behind existing boundary', async () => {
	const roles = mockDeep<RolesRepository>();
	const assigns = mockDeep<RoleAssignmentsRepository>();
	const query = mockDeep<ReturnType<RoleAssignmentsRepository['createQueryBuilder']>>();
	const ids = mockDeep<IdService>();
	assigns.createQueryBuilder.mockReturnValue(query);
	query.where.mockReturnValue(query);
	query.andWhere.mockReturnValue(query);
	query.getCount.mockResolvedValue(2);
	ids.parse.mockReturnValue({ date });
	const formula = { id: 'formula123', type: 'isLocal', future: true } as const;
	const customPolicy = { value: true, priority: 0, useDefault: false, extension: true };
	const role = mockDeep<MiRole>({
		id: 'role123', updatedAt: date, name: 'role', description: '', color: null, iconUrl: null, target: 'manual',
		condFormula: formula, isPublic: true, isExplorable: true, isAdministrator: false, isModerator: false,
		asBadge: false, preserveAssignmentOnMoveAccount: false, canEditMembersByModerator: false, displayOrder: 0,
		policies: { custom: customPolicy },
	});
	const serializer = new RoleEntityService(roles, assigns, ids);
	const result = await serializer.pack(role);
	expect(result).toMatchObject({ createdAt: date.toISOString(), updatedAt: date.toISOString(), condFormula: formula, usersCount: 2 });
	expect(result.policies.custom).toEqual(customPolicy);
	expect(result.policies.chatAvailability).toEqual({ value: 'available', priority: 0, useDefault: true });
	expect(result.policies.uploadableFileTypes).toEqual({ value: DEFAULT_POLICIES.uploadableFileTypes, priority: 0, useDefault: true });
	// Existing int/bool value declarations do not validate these real producer defaults.
	expect(v.safeParse(packedRoleSchema, result).success).toBe(false);
	roles.findOneBy.mockResolvedValue(role);
	roles.findBy.mockResolvedValue([role]);
	const actor = mockDeep<MiLocalUser>({ id: 'actor123' });
	expect(await new ShowEndpoint(roles, serializer).exec({ roleId: role.id }, actor, null)).toEqual(result);
	expect(roles.findOneBy).toHaveBeenLastCalledWith({ id: role.id, isPublic: true });
	expect(await new ListEndpoint(roles, serializer).exec({}, actor, null)).toEqual([result]);
	expect(roles.findBy).toHaveBeenCalledWith({ isPublic: true, isExplorable: true });
	roles.findOneBy.mockResolvedValue(null);
	await expect(new ShowEndpoint(roles, serializer).exec({ roleId: role.id }, actor, null)).rejects.toMatchObject({ code: 'NO_SUCH_ROLE' });
});
