/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type * as v from 'valibot';
import type { opaqueObject } from '@features/api/contract/opaque-object.js';
import type { packedAdminRolesCreateInput } from '@features/roles/contract/packed-endpoint-definitions.js';
import type { voidAdminRolesUpdateInput } from '@features/roles/contract/void-endpoint-definitions.js';
import type { RoleService } from '@features/roles/backend/services/RoleService.js';
import type { LegacyRoleCreateConsumerInput, LegacyRoleUpdateConsumerInput } from '@features/roles/backend/legacy-role-consumer-endpoint.js';

type Assert<T extends true> = T;
type IsAny<T> = 0 extends (1 & T) ? true : false;
type NativeCreate = v.InferOutput<typeof packedAdminRolesCreateInput>;
type NativeUpdate = v.InferOutput<typeof voidAdminRolesUpdateInput>;
type RoleFormula = NonNullable<Parameters<RoleService['create']>[0]['condFormula']>;
export type HonestOpaque = Assert<v.InferOutput<typeof opaqueObject> extends Record<string, unknown> ? true : false>;
export type NotAny = Assert<IsAny<NativeCreate['condFormula']> extends false ? true : false>;
export type NotDomainProof = Assert<NativeCreate['condFormula'] extends RoleFormula ? false : true>;
export type RequiredCreate = Assert<undefined extends NativeCreate['condFormula'] ? false : true>;
export type OptionalUpdate = Assert<undefined extends NativeUpdate['condFormula'] ? true : false>;
export type NativeDefault = Assert<undefined extends NativeCreate['isExplorable'] ? false : true>;
export type CreateConsumer = Assert<LegacyRoleCreateConsumerInput extends Parameters<RoleService['create']>[0] ? true : false>;
export type UpdateConsumer = Assert<LegacyRoleUpdateConsumerInput extends Parameters<RoleService['update']>[1] ? true : false>;
export type PreservedName = Assert<LegacyRoleCreateConsumerInput['name'] extends NativeCreate['name'] ? true : false>;
export type LegacyConsumerNotAny = Assert<IsAny<LegacyRoleCreateConsumerInput['condFormula']> extends false ? true : false>;
export type NativeRemainsUntrusted = Assert<NativeCreate extends LegacyRoleCreateConsumerInput ? false : true>;
