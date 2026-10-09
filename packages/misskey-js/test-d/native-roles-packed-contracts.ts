/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: MIT
 */

import { expectAssignable, expectNotAssignable } from 'tsd';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import type * as v from 'valibot';
import type { rolesContract } from '../built/contracts/roles/backend/api.contract.js';
import type { roleSchema, roleCondFormulaSchema, packedRoleLiteSchema, rolePoliciesSchema } from '../built/contracts/roles/backend/role.schema.js';
import type { PackedModels } from '../built/contracts/index/backend/packed.schema.js';
import type { ContractEndpoints } from '../built/contract.types.js';
import type { Endpoints } from '../built/api.types.js';
import type { entities } from '../built/index.js';
import type { AdminRolesCreateRequest } from '../built/autogen/entities.js';
import type { PartialRolePolicyOverride } from '../built/entities.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type IsAny<T> = 0 extends (1 & T) ? true : false;

type NativeContracts = {
	'admin/roles/assign': typeof rolesContract.adminRolesAssign;
	'admin/roles/create': typeof rolesContract.adminRolesCreate;
	'admin/roles/delete': typeof rolesContract.adminRolesDelete;
	'admin/roles/list': typeof rolesContract.adminRolesList;
	'admin/roles/show': typeof rolesContract.adminRolesShow;
	'admin/roles/unassign': typeof rolesContract.adminRolesUnassign;
	'admin/roles/update': typeof rolesContract.adminRolesUpdate;
	'admin/roles/update-default-policies': typeof rolesContract.adminRolesUpdateDefaultPolicies;
	'admin/roles/users': typeof rolesContract.adminRolesUsers;
	'roles/list': typeof rolesContract.rolesList;
	'roles/notes': typeof rolesContract.rolesNotes;
	'roles/show': typeof rolesContract.rolesShow;
	'roles/users': typeof rolesContract.rolesUsers;
};
type Covered = keyof NativeContracts;
type NativeRequest<K extends Covered> = InferContractRouterInputs<NativeContracts[K]>;
type NativeResponse<K extends Covered> = InferContractRouterOutputs<NativeContracts[K]> extends void
	? null : InferContractRouterOutputs<NativeContracts[K]>;
export type Coverage = Assert<Equal<NativeContracts[Covered], (typeof rolesContract)[keyof typeof rolesContract]>>;
export type NativeRequestParity = Assert<Equal<{ [K in Covered]: Equal<ContractEndpoints[K]['req'], NativeRequest<K>> }[Covered], true>>;
export type NativeResponseParity = Assert<Equal<{ [K in Covered]: Equal<ContractEndpoints[K]['res'], NativeResponse<K>> }[Covered], true>>;
export type PublishedResponseParity = Assert<Equal<{ [K in Covered]: Equal<Endpoints[K]['res'], ContractEndpoints[K]['res']> }[Covered], true>>;
export type PublishedRequestParity = Assert<Equal<{
	[K in Exclude<Covered, 'admin/roles/create'>]: Equal<Endpoints[K]['req'], ContractEndpoints[K]['req']>
}[Exclude<Covered, 'admin/roles/create'>], true>>;

export type RoleExact = Assert<Equal<entities.Role, v.InferOutput<typeof roleSchema>>>;
export type RoleRegistry = Assert<Equal<PackedModels['Role'], entities.Role>>;
export type RoleLiteExact = Assert<Equal<entities.RoleLite, v.InferOutput<typeof packedRoleLiteSchema>>>;
export type RolePoliciesExact = Assert<Equal<entities.RolePolicies, v.InferOutput<typeof rolePoliciesSchema>>>;
export type FormulaRegistry = Assert<Equal<PackedModels['RoleCondFormulaValue'], v.InferOutput<typeof roleCondFormulaSchema>>>;
export type RoleNoAny = Assert<Equal<IsAny<entities.Role>, false>>;
export type PolicyValueNoAny = Assert<Equal<IsAny<entities.Role['policies'][string]['value']>, false>>;

// Empty requests still require objects, and client defaults remain optional until execution.
export type EmptyAdminKeys = Assert<Equal<keyof Endpoints['admin/roles/list']['req'], never>>;
export type EmptyAdminPrimitive = Assert<Equal<1 extends Endpoints['admin/roles/list']['req'] ? true : false, false>>;
export type EmptyPublicKeys = Assert<Equal<keyof Endpoints['roles/list']['req'], never>>;
export type EmptyPublicPrimitive = Assert<Equal<1 extends Endpoints['roles/list']['req'] ? true : false, false>>;
type AdminUsersRequest = Endpoints['admin/roles/users']['req'];
// Materialize the field shape of the native object guard intersection; a defaulted limit accepts undefined.
export type DeclaredAdminUsers = Assert<Equal<{ [Key in keyof AdminUsersRequest]: AdminUsersRequest[Key] }, {
	roleId: string; sinceId?: string; untilId?: string; sinceDate?: number; untilDate?: number; limit?: number | undefined;
}>>;
export type AdminUsersObjectOnly = Assert<Equal<1 extends AdminUsersRequest ? true : false, false>>;
// The public SDK retains its deliberate policy-key adapter for role creation.
export type ReviewedCreateAdapter = Assert<Equal<Endpoints['admin/roles/create']['req'],
	Omit<AdminRolesCreateRequest, 'policies'> & { policies: PartialRolePolicyOverride }>>;

// Input JSON acceptance does not claim malformed stored domain data is a valid output DTO.
expectAssignable<ContractEndpoints['admin/roles/create']['req']['condFormula']>({ future: { nested: true } });
expectAssignable<ContractEndpoints['admin/roles/create']['req']['policies']>({ custom: { value: ['image/*'], extension: true } });
expectNotAssignable<ContractEndpoints['admin/roles/create']['req']['policies']>({ future: new Date() });
expectAssignable<entities.Role['policies'][string]>({ value: { future: { nested: [null, true] } }, priority: 0, useDefault: true });
expectNotAssignable<entities.Role['policies'][string]>({ value: new Date(), priority: 0, useDefault: true });
expectNotAssignable<entities.Role['policies'][string]>({ value: 'available', priority: 0, useDefault: true, future: true });
expectAssignable<entities.Role['policies'][string]>({ value: ['image/*'] });
expectAssignable<entities.Role['policies'][string]>({});
expectAssignable<entities.Role['policies'][string]>({ value: 3 });
expectNotAssignable<entities.RoleLite>({ id: 'role', name: 'role', color: null, iconUrl: null, description: '', isModerator: false, isAdministrator: false, displayOrder: 0, future: true });
