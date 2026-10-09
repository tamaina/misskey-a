/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { createRouterClient } from '@orpc/server';
import Fastify from 'fastify';
import { OpenAPIHandler } from '@orpc/openapi/fastify';
import { registerPilotHttp } from '../../../api/backend/transport/pilot-http.js';
import { nullSuccessToNoContent } from '../../../api/backend/transport/no-content.js';
import { rolesContract } from '../../backend/api.definition.js';
import { roleCondFormulaSchema, rolePoliciesSchema, rolePolicySettingsSchema } from '../../backend/role.schema.js';
import type { RolesDependencies } from '../../backend/api.implementation.js';
import { createRolesRouter } from '../../backend/api.implementation.js';
import type { ApiActor, ApiAuthorization, ApiContext } from '../../../api/backend/transport/context.js';
import type { MiUser } from '../../../users/backend/models/User.js';
import { MiRole } from '../../backend/models/Role.js';
import { RoleEntityService } from '../../backend/serializers/RoleEntityService.js';
import type { RolesRepository, RoleAssignmentsRepository } from '../../../persistence/backend/repositories/models.js';
import type { IdService } from '../../../runtime/backend/services/IdService.js';
import { roleSchema } from '../../backend/role.schema.js';
import { DEFAULT_POLICIES } from '../../backend/services/RoleService.js';
import { normalizeError, misskeyErrorBody } from '../../../api/backend/transport/orpc-error.js';
import { packedRoleSchema as notificationRoleSchema } from '../../../notifications/backend/notification-related.schema.js';

function requiredSchema<S extends v.GenericSchema>(schema: S | undefined): S {
	if (schema === undefined) throw new Error('Missing native schema');
	return schema;
}

const actor: ApiActor = { id: 'actor123', isSuspended: false, movedToUri: null };
const role = (membersEditable: boolean) => mockDeep<MiRole>({ id: 'role123', canEditMembersByModerator: membersEditable });

function createRolesClient(deps: RolesDependencies<ApiActor>, principal: ApiActor | null = actor) {
	const context = mockDeep<ApiContext<ApiActor>>();
	context.services.authenticate.mockResolvedValue([principal, null]);
	context.services.limit.mockResolvedValue(null);
	context.services.rateLimitFactor.mockResolvedValue(1);
	const authorization = mockDeep<ApiAuthorization<ApiActor>>();
	authorization.rootUserId.mockReturnValue(actor.id);
	authorization.roles.mockResolvedValue([]);
	authorization.policyAllowed.mockResolvedValue(false);
	context.authorization = authorization;
	return createRouterClient(createRolesRouter<ApiActor>(deps), { context });
}

test('recursive role formulas validate every branch and reject undeclared fields and nonfinite thresholds', () => {
	const formula = {
		id: 'root', type: 'and', values: [
			{ id: 'local', type: 'isLocal' },
			{ id: 'not', type: 'not', value: { id: 'age', type: 'createdMoreThan', sec: 60 } },
		]
	};
	expect(v.parse(roleCondFormulaSchema, formula)).toEqual(formula);
	for (const bad of [{}, { ...formula, future: true }, { id: 'root', type: 'unknown' },
	{ id: 'age', type: 'createdMoreThan', sec: Infinity }, { id: 'not', type: 'not', value: null },
	{ ...formula, values: [{ id: 'local', type: 'isLocal', future: true }] }]) {
		expect(v.safeParse(roleCondFormulaSchema, bad).success).toBe(false);
	}
});

test('native role defaults and nullable updates are concrete; policies retain fractional rate limit factors', () => {
	expect(v.parse(requiredSchema(rolesContract.rolesNotes['~orpc'].inputSchema), { roleId: 'role123', future: true })).toEqual({ roleId: 'role123', limit: 10 });
	expect(v.parse(requiredSchema(rolesContract.adminRolesUpdate['~orpc'].inputSchema), { roleId: 'role123', color: null, iconUrl: null, displayOrder: 0.5, future: true }))
		.toEqual({ roleId: 'role123', color: null, iconUrl: null, displayOrder: 0.5 });
	expect(v.parse(rolePoliciesSchema, { ...DEFAULT_POLICIES, rateLimitFactor: 0.5 }).rateLimitFactor).toBe(0.5);
	expect(v.safeParse(rolePoliciesSchema, { ...DEFAULT_POLICIES, rateLimitFactor: Infinity }).success).toBe(false);
	for (const bad of [[], { roleId: 'bad-id' }, { roleId: 'role123', limit: 0 }, { roleId: 'role123', limit: 101 }]) {
		expect(v.safeParse(requiredSchema(rolesContract.rolesUsers['~orpc'].inputSchema), bad).success).toBe(false);
	}
});

test('role member edit privilege is checked before user lookup and an expired assignment is a no-op', async () => {
	const deps = mockDeep<RolesDependencies<ApiActor>>();
	deps.rolesRepository.findOneBy.mockResolvedValue(role(false));
	deps.roleService.isAdministrator.mockResolvedValue(false);
	const operations = createRolesClient(deps);
	await expect(operations.adminRolesAssign({ roleId: 'role123', userId: 'user123' }))
		.rejects.toMatchObject({ code: 'ACCESS_DENIED', data: { id: '25b5bc31-dc79-4ebd-9bd2-c84978fd052c' } });
	expect(deps.usersRepository.findOneBy).not.toHaveBeenCalled();
	deps.roleService.isAdministrator.mockResolvedValue(true);
	deps.usersRepository.findOneBy.mockResolvedValue(mockDeep<MiUser>({ id: 'user123' }));
	await operations.adminRolesAssign({ roleId: 'role123', userId: 'user123', expiresAt: 1 });
	expect(deps.roleService.assign).not.toHaveBeenCalled();
	await operations.adminRolesAssign({ roleId: 'role123', userId: 'user123', expiresAt: null });
	expect(deps.roleService.assign).toHaveBeenCalledWith('user123', 'role123', null, actor);
});

test('private roles stay hidden in public lookup and unexplorable roles have an empty note timeline', async () => {
	const deps = mockDeep<RolesDependencies<ApiActor>>();
	deps.rolesRepository.findOneBy.mockResolvedValue(null);
	const operations = createRolesClient(deps);
	await expect(createRolesClient(deps, null).rolesShow({ roleId: 'role123' })).rejects.toMatchObject({ code: 'NO_SUCH_ROLE' });
	expect(deps.rolesRepository.findOneBy).toHaveBeenCalledWith({ id: 'role123', isPublic: true });
	deps.rolesRepository.findOneBy.mockResolvedValue(mockDeep<MiRole>({ id: 'role123', isExplorable: false }));
	expect(await operations.rolesNotes({ roleId: 'role123', limit: 10 })).toEqual([]);
	expect(deps.fanoutTimelineService.get).not.toHaveBeenCalled();
});

test('moderator credential requirement runs before malformed input; root bypasses role assignment checks', async () => {
	const deps = mockDeep<RolesDependencies<ApiActor>>();
	const context = mockDeep<ApiContext<ApiActor>>();
	context.services.authenticate.mockResolvedValue([null, null]);
	const client = createRouterClient(createRolesRouter<ApiActor>(deps), { context });
	await expect(client.adminRolesUsers({ roleId: 'bad-id' })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
	expect(deps.rolesRepository.findOneBy).not.toHaveBeenCalled();
	context.services.authenticate.mockResolvedValue([actor, null]);
	const authorization = mockDeep<ApiAuthorization<ApiActor>>();
	authorization.rootUserId.mockReturnValue(actor.id);
	authorization.roles.mockResolvedValue([]);
	authorization.policyAllowed.mockResolvedValue(false);
	context.authorization = authorization;
	const storedRole = role(false);
	deps.rolesRepository.findOneBy.mockResolvedValue(storedRole);
	await client.adminRolesDelete({ roleId: 'role123' });
	expect(deps.roleService.delete).toHaveBeenCalledWith(storedRole, actor);
});

test('the role serializer materializes canonical defaults and finite policy values with ISO dates', async () => {
	const assignments = mockDeep<RoleAssignmentsRepository>();
	const query = mockDeep<ReturnType<RoleAssignmentsRepository['createQueryBuilder']>>();
	assignments.createQueryBuilder.mockReturnValue(query);
	query.where.mockReturnValue(query);
	query.andWhere.mockReturnValue(query);
	query.getCount.mockResolvedValue(3);
	const ids = mockDeep<IdService>();
	const date = new Date('2026-10-09T00:00:00Z');
	ids.parse.mockReturnValue(mockDeep<ReturnType<IdService['parse']>>({ date }));
	const serializer = new RoleEntityService(mockDeep<RolesRepository>(), assignments, ids);
	const row = mockDeep<MiRole>({
		id: 'role123', updatedAt: date, name: 'Role', description: '', color: null, iconUrl: null,
		target: 'manual', condFormula: { id: 'local', type: 'isLocal' }, isPublic: true,
		isAdministrator: false, isModerator: false, isExplorable: true, asBadge: false,
		preserveAssignmentOnMoveAccount: false, canEditMembersByModerator: false, displayOrder: 0,
		policies: { rateLimitFactor: { useDefault: false, priority: 1, value: 0.5 } },
	});
	const packed = v.parse(roleSchema, await serializer.pack(row, actor));
	expect(packed).toMatchObject({
		createdAt: date.toISOString(), updatedAt: date.toISOString(), usersCount: 3,
		policies: { rateLimitFactor: { useDefault: false, priority: 1, value: 0.5 }, canPublicNote: { useDefault: true, priority: 0, value: true } }
	});
	expect(v.safeParse(roleSchema, { ...packed, future: true }).success).toBe(false);
});

test('role formula/settings inputs preserve original object-only acceptance, including malformed domain shapes', () => {
	const formula = { future: { nested: true } };
	const policies = { custom: { value: ['image/*'], extension: true } };
	const request = {
		name: 'Role', description: '', color: null, iconUrl: null, target: 'manual', condFormula: formula,
		isPublic: true, isModerator: false, isAdministrator: false, asBadge: false,
		canEditMembersByModerator: false, displayOrder: 0.5, policies,
	};
	expect(v.parse(requiredSchema(rolesContract.adminRolesCreate['~orpc'].inputSchema), request)).toEqual({ ...request, isExplorable: false });
	expect(v.parse(requiredSchema(rolesContract.adminRolesUpdate['~orpc'].inputSchema), { roleId: 'role123', condFormula: formula, policies }))
		.toEqual({ roleId: 'role123', condFormula: formula, policies });
	expect(v.parse(requiredSchema(rolesContract.adminRolesUpdateDefaultPolicies['~orpc'].inputSchema), { policies })).toEqual({ policies });
	for (const value of [null, [], 'object', 1]) {
		expect(v.safeParse(requiredSchema(rolesContract.adminRolesCreate['~orpc'].inputSchema), { ...request, condFormula: value }).success).toBe(false);
		expect(v.safeParse(requiredSchema(rolesContract.adminRolesCreate['~orpc'].inputSchema), { ...request, policies: value }).success).toBe(false);
	}
	// Stored malformed domain payloads retain their write acceptance; explicit output DTOs reject them.
	expect(v.safeParse(roleCondFormulaSchema, formula).success).toBe(false);
});

test('legacy empty formulas survive manual and conditional create/list/show/update; nonempty malformed output still rejects', async () => {
	const date = new Date('2026-10-09T00:00:00Z');
	const legacy = Object.assign(new MiRole(), {
		id: 'role123', updatedAt: date, name: 'Role', description: '', color: null, iconUrl: null,
		target: 'manual', condFormula: {}, isPublic: true, isAdministrator: false, isModerator: false,
		isExplorable: true, asBadge: false, preserveAssignmentOnMoveAccount: false,
		canEditMembersByModerator: false, displayOrder: 0, policies: {},
	});
	const assignments = mockDeep<RoleAssignmentsRepository>();
	const query = mockDeep<ReturnType<RoleAssignmentsRepository['createQueryBuilder']>>();
	assignments.createQueryBuilder.mockReturnValue(query);
	query.where.mockReturnValue(query);
	query.andWhere.mockReturnValue(query);
	query.getCount.mockResolvedValue(0);
	const ids = mockDeep<IdService>();
	ids.parse.mockReturnValue(mockDeep<ReturnType<IdService['parse']>>({ date }));
	const serializer = new RoleEntityService(mockDeep<RolesRepository>(), assignments, ids);
	const packed = await serializer.pack(legacy, actor);
	expect(v.parse(roleSchema, packed).condFormula).toEqual({});
	expect(v.parse(notificationRoleSchema, packed).condFormula).toEqual({});
	expect(v.parse(roleSchema, { ...packed, target: 'conditional' }).condFormula).toEqual({});
	expect(v.parse(notificationRoleSchema, { ...packed, target: 'conditional' }).condFormula).toEqual({});
	expect(v.safeParse(roleSchema, { ...packed, condFormula: { future: true } }).success).toBe(false);
	expect(v.safeParse(notificationRoleSchema, { ...packed, condFormula: { future: true } }).success).toBe(false);
	const deps = mockDeep<RolesDependencies<ApiActor>>();
	deps.rolesRepository.find.mockResolvedValue([legacy]);
	deps.rolesRepository.findOneBy.mockResolvedValue(legacy);
	deps.roleService.create.mockResolvedValue(legacy);
	deps.roleEntityService.pack.mockImplementation((row, principal) => serializer.pack(row, principal));
	deps.roleEntityService.packMany.mockImplementation((rows, principal) => serializer.packMany(rows, principal));
	const apiContext = mockDeep<ApiContext<ApiActor>>();
	apiContext.services.authenticate.mockResolvedValue([actor, null]);
	const context: ApiContext<ApiActor> = {
		...apiContext,
		mapError: normalizeError,
		authorization: { rootUserId: () => actor.id, roles: async () => [], policyAllowed: async () => false },
	};
	const client = createRouterClient(createRolesRouter<ApiActor>(deps), { context });
	const request = v.parse(requiredSchema(rolesContract.adminRolesCreate['~orpc'].inputSchema), {
		name: 'Role', description: '', color: null, iconUrl: null, target: 'manual', condFormula: {},
		isPublic: true, isModerator: false, isAdministrator: false, asBadge: false,
		canEditMembersByModerator: false, displayOrder: 0, policies: {},
	});
	expect((await client.adminRolesCreate(request)).condFormula).toEqual({});
	expect((await client.adminRolesList({}))[0].condFormula).toEqual({});
	expect((await client.adminRolesShow({ roleId: legacy.id })).condFormula).toEqual({});
	expect((await client.rolesShow({ roleId: legacy.id })).condFormula).toEqual({});
	await client.adminRolesUpdate(v.parse(requiredSchema(rolesContract.adminRolesUpdate['~orpc'].inputSchema), { roleId: legacy.id, name: 'Renamed', condFormula: {} }));
	expect(deps.roleService.update).toHaveBeenCalledWith(legacy, expect.objectContaining({ name: 'Renamed', condFormula: {} }), actor);
	const conditional = Object.assign(new MiRole(), legacy, { target: 'conditional', condFormula: {} });
	deps.rolesRepository.find.mockResolvedValue([conditional]);
	deps.rolesRepository.findOneBy.mockResolvedValue(conditional);
	deps.roleService.create.mockResolvedValue(conditional);
	expect((await client.adminRolesCreate({ ...request, target: 'conditional' })).condFormula).toEqual({});
	expect(deps.roleService.create).toHaveBeenLastCalledWith({ ...request, target: 'conditional' }, actor);
	expect((await client.adminRolesList({}))[0].condFormula).toEqual({});
	expect((await client.adminRolesShow({ roleId: conditional.id })).condFormula).toEqual({});
	expect((await client.rolesShow({ roleId: conditional.id })).condFormula).toEqual({});
	await client.adminRolesUpdate(v.parse(requiredSchema(rolesContract.adminRolesUpdate['~orpc'].inputSchema), { roleId: conditional.id, target: 'conditional', condFormula: {} }));
	expect(deps.roleService.update).toHaveBeenLastCalledWith(conditional, expect.objectContaining({ target: 'conditional', condFormula: {} }), actor);
	// Object-only input still writes nonempty malformed formulas before the output boundary rejects them.
	const malformedFormulas: v.InferOutput<NonNullable<typeof rolesContract.adminRolesCreate['~orpc']['inputSchema']>>['condFormula'][] = [
		{ type: 'isLocal' }, { id: 'unknown', type: 'unknown' }, { future: true },
	];
	for (const formula of malformedFormulas) {
		const malformed = Object.assign(new MiRole(), conditional, { condFormula: formula });
		deps.roleService.create.mockResolvedValue(malformed);
		await expect(client.adminRolesCreate({ ...request, target: 'conditional', condFormula: formula }))
			.rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
		expect(deps.roleService.create).toHaveBeenLastCalledWith({ ...request, target: 'conditional', condFormula: formula }, actor);
		expect(deps.roleEntityService.pack).toHaveBeenLastCalledWith(malformed, actor);
	}
	// Exercise the production HTTP adapter so create output and void assignment mapping are both checked.
	deps.roleService.create.mockResolvedValue(legacy);
	deps.rolesRepository.findOneBy.mockResolvedValue(legacy);
	deps.roleService.isAdministrator.mockResolvedValue(true);
	deps.usersRepository.findOneBy.mockResolvedValue(mockDeep<MiUser>({ id: 'user123' }));
	const app = Fastify();
	const handler = new OpenAPIHandler(createRolesRouter<ApiActor>(deps), {
		customErrorResponseBodyEncoder: misskeyErrorBody,
		interceptors: [nullSuccessToNoContent()],
	});
	await app.register(async api => registerPilotHttp(api, handler, {
		maxFileSize: 1024, context: () => context, runSpan: (_name, run) => run(),
	}), { prefix: '/api' });
	try {
		const created = await app.inject({ method: 'POST', url: '/api/admin/roles/create', payload: request });
		expect(created.statusCode).toBe(200);
		expect(v.parse(roleSchema, created.json())).toMatchObject({
			id: legacy.id, condFormula: {}, policies: {
				canPublicNote: { useDefault: true, priority: 0, value: true },
			}
		});
		// Federation fixtures use the same complete condition DTO as the role editor.
		const remoteFormula = { id: 'remote', type: 'isRemote' } as const;
		const remote = Object.assign(new MiRole(), legacy, { target: 'conditional', condFormula: remoteFormula });
		deps.roleService.create.mockResolvedValue(remote);
		const remoteCreated = await app.inject({ method: 'POST', url: '/api/admin/roles/create', payload: { ...request, target: 'conditional', condFormula: remoteFormula } });
		expect(remoteCreated.statusCode).toBe(200);
		expect(v.parse(roleSchema, remoteCreated.json())).toMatchObject({ target: 'conditional', condFormula: remoteFormula });
		expect(deps.roleService.create).toHaveBeenLastCalledWith({ ...request, target: 'conditional', condFormula: remoteFormula }, actor);
		const assigned = await app.inject({ method: 'POST', url: '/api/admin/roles/assign', payload: { roleId: legacy.id, userId: 'user123' } });
		expect(assigned.statusCode).toBe(204);
		expect(assigned.body).toBe('');
		expect(deps.roleService.assign).toHaveBeenLastCalledWith('user123', legacy.id, null, actor);
	} finally {
		await app.close();
	}
});

test('sparse stored policy settings stay sparse and known undefined fields disappear at the wire boundary', async () => {
	const settings = { empty: {}, canPublicNote: {}, valueOnly: { value: 3 }, omitted: { useDefault: undefined, priority: undefined, value: undefined } };
	expect(v.parse(rolePolicySettingsSchema, settings)).toEqual(settings);
	for (const invalid of [{ value: Infinity }, { priority: Infinity }, { useDefault: null }, { value: new Date() }, { future: true }]) {
		expect(v.safeParse(rolePolicySettingsSchema, { custom: invalid }).success).toBe(false);
	}
	const assignments = mockDeep<RoleAssignmentsRepository>();
	const query = mockDeep<ReturnType<RoleAssignmentsRepository['createQueryBuilder']>>();
	assignments.createQueryBuilder.mockReturnValue(query);
	query.where.mockReturnValue(query);
	query.andWhere.mockReturnValue(query);
	query.getCount.mockResolvedValue(0);
	const ids = mockDeep<IdService>();
	const date = new Date('2026-10-09T00:00:00Z');
	ids.parse.mockReturnValue(mockDeep<ReturnType<IdService['parse']>>({ date }));
	// A real entity fixture preserves absent data properties instead of deep-mock accessors.
	const row = Object.assign(new MiRole(), {
		id: 'role123', updatedAt: date, name: 'Role', description: '', color: null, iconUrl: null,
		target: 'manual', condFormula: { id: 'local', type: 'isLocal' }, isPublic: true,
		isAdministrator: false, isModerator: false, isExplorable: true, asBadge: false,
		preserveAssignmentOnMoveAccount: false, canEditMembersByModerator: false, displayOrder: 0,
		policies: settings,
	});
	const serializer = new RoleEntityService(mockDeep<RolesRepository>(), assignments, ids);
	const packed = v.parse(roleSchema, await serializer.pack(row, actor));
	expect(packed.policies.empty).toEqual({});
	expect(packed.policies.valueOnly).toEqual({ value: 3 });
	expect(packed.policies.omitted).toEqual({});
	expect(Object.keys(packed.policies.omitted)).toEqual([]);
	expect(packed.policies.canPublicNote).toEqual({});
	expect(packed.policies.gtlAvailable).toEqual({ useDefault: true, priority: 0, value: true });
});
