/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { packedRoleLiteSchema, packedRolePoliciesSchema } from '../../users/backend/user-related.schema.js';
import { packedOptionalJsonValueSchema, type PackedJsonValue } from '../../users/backend/json-value.schema.js';
export { packedRoleLiteSchema, packedRolePoliciesSchema };
export const rolePoliciesSchema = v.strictObject({ ...packedRolePoliciesSchema.entries, rateLimitFactor: v.pipe(v.number(), v.finite()) });

export type RoleFormula = { id: string } & (
 { type: 'and'; values: RoleFormula[] } | { type: 'or'; values: RoleFormula[] } | { type: 'not'; value: RoleFormula } |
{ type: 'isLocal' } | { type: 'isRemote' } | { type: 'isSuspended' } | { type: 'isLocked' } | { type: 'isBot' } | { type: 'isCat' } | { type: 'isExplorable' } |
 { type: 'roleAssignedTo'; roleId: string } |
{ type: 'createdLessThan'; sec: number } | { type: 'createdMoreThan'; sec: number } |
{ type: 'followersLessThanOrEq'; value: number } | { type: 'followersMoreThanOrEq'; value: number } | { type: 'followingLessThanOrEq'; value: number } | { type: 'followingMoreThanOrEq'; value: number } | { type: 'notesLessThanOrEq'; value: number } | { type: 'notesMoreThanOrEq'; value: number }
);
const finite = v.pipe(v.number(), v.finite());
export const roleCondFormulaSchema: v.GenericSchema<RoleFormula> = v.lazy(() => v.variant('type', [
	v.strictObject({ id: v.string(), type: v.literal('and'), values: v.array(roleCondFormulaSchema) }),
	v.strictObject({ id: v.string(), type: v.literal('or'), values: v.array(roleCondFormulaSchema) }),
	v.strictObject({ id: v.string(), type: v.literal('not'), value: roleCondFormulaSchema }),
	v.strictObject({ id: v.string(), type: v.literal('isLocal') }),
	v.strictObject({ id: v.string(), type: v.literal('isRemote') }),
	v.strictObject({ id: v.string(), type: v.literal('isSuspended') }),
	v.strictObject({ id: v.string(), type: v.literal('isLocked') }),
	v.strictObject({ id: v.string(), type: v.literal('isBot') }),
	v.strictObject({ id: v.string(), type: v.literal('isCat') }),
	v.strictObject({ id: v.string(), type: v.literal('isExplorable') }),
	v.strictObject({ id: v.string(), type: v.literal('roleAssignedTo'), roleId: v.string() }),
	v.strictObject({ id: v.string(), type: v.literal('createdLessThan'), sec: finite }),
	v.strictObject({ id: v.string(), type: v.literal('createdMoreThan'), sec: finite }),
	v.strictObject({ id: v.string(), type: v.literal('followersLessThanOrEq'), value: finite }),
	v.strictObject({ id: v.string(), type: v.literal('followersMoreThanOrEq'), value: finite }),
	v.strictObject({ id: v.string(), type: v.literal('followingLessThanOrEq'), value: finite }),
	v.strictObject({ id: v.string(), type: v.literal('followingMoreThanOrEq'), value: finite }),
	v.strictObject({ id: v.string(), type: v.literal('notesLessThanOrEq'), value: finite }),
	v.strictObject({ id: v.string(), type: v.literal('notesMoreThanOrEq'), value: finite }),
]));
/** Sparse stored settings have an exact finite DTO independent of recursive validator declaration expansion. */
export type RolePolicySetting = {
	useDefault?: boolean | undefined;
	priority?: number | undefined;
	value?: PackedJsonValue | undefined;
};
export const rolePolicySettingsSchema: v.GenericSchema<Record<string, RolePolicySetting>> = v.record(v.string(), v.strictObject({
	useDefault: v.optional(v.boolean()), priority: v.optional(finite), value: packedOptionalJsonValueSchema,
}));
export const roleSchema = v.strictObject({
	...packedRoleLiteSchema.entries,
	createdAt: v.string(), updatedAt: v.string(), target: v.picklist(['manual', 'conditional']),
	condFormula: roleCondFormulaSchema, isPublic: v.boolean(), isExplorable: v.boolean(), asBadge: v.boolean(),
	preserveAssignmentOnMoveAccount: v.boolean(), canEditMembersByModerator: v.boolean(),
	policies: rolePolicySettingsSchema, usersCount: v.pipe(finite, v.integer()),
});
export const packedRoleSchema = roleSchema;
export const packedRoleCondFormulaValueSchema = roleCondFormulaSchema;
