/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { objectInput } from '../../api/backend/transport/input.schema.js';
import { packedUserDetailedSchema } from '../../users/backend/user.schema.js';
import { roleSchema } from '../../roles/backend/role.schema.js';
import { packedJsonObjectSchema, packedOptionalJsonObjectSchema } from '../../users/backend/json-value.schema.js';
import { packedNoteSchema } from '../../notes/backend/note.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));
export const adminRolesAssignInput = objectInput({
	"roleId": misskeyId,
	"userId": misskeyId,
	"expiresAt": v.exactOptional(v.nullable(v.pipe(v.number(), v.integer()))),
});
export const adminRolesAssignOutput = v.void();

export const adminRolesCreateInput = objectInput({
	name: v.string(),
	description: v.string(),
	color: v.nullable(v.string()),
	iconUrl: v.nullable(v.string()),
	target: v.picklist(['manual', 'conditional']),
	condFormula: packedJsonObjectSchema,
	isPublic: v.boolean(),
	isModerator: v.boolean(),
	isAdministrator: v.boolean(),
	isExplorable: v.optional(v.boolean(), false),
	asBadge: v.boolean(),
	preserveAssignmentOnMoveAccount: v.optional(v.boolean()),
	canEditMembersByModerator: v.boolean(),
	displayOrder: v.pipe(v.number(), v.finite()),
	policies: packedJsonObjectSchema,
});
export const adminRolesCreateOutput = roleSchema;

export const adminRolesDeleteInput = objectInput({
	"roleId": misskeyId,
});
export const adminRolesDeleteOutput = v.void();

export const adminRolesListInput = objectInput({});
export const adminRolesListOutput = v.array(roleSchema);

export const adminRolesShowInput = objectInput({
	"roleId": misskeyId,
});
export const adminRolesShowOutput = roleSchema;

export const adminRolesUnassignInput = objectInput({
	"roleId": misskeyId,
	"userId": misskeyId,
});
export const adminRolesUnassignOutput = v.void();

export const adminRolesUpdateInput = objectInput({
	"roleId": misskeyId,
	"name": v.exactOptional(v.string()),
	"description": v.exactOptional(v.string()),
	"color": v.exactOptional(v.nullable(v.string())),
	"iconUrl": v.exactOptional(v.nullable(v.string())),
	"target": v.exactOptional(v.picklist(["manual", "conditional"])),
	"condFormula": packedOptionalJsonObjectSchema,
	"isPublic": v.exactOptional(v.boolean()),
	"isModerator": v.exactOptional(v.boolean()),
	"isAdministrator": v.exactOptional(v.boolean()),
	"isExplorable": v.exactOptional(v.boolean()),
	"asBadge": v.exactOptional(v.boolean()),
	"preserveAssignmentOnMoveAccount": v.exactOptional(v.boolean()),
	"canEditMembersByModerator": v.exactOptional(v.boolean()),
	"displayOrder": v.exactOptional(v.pipe(v.number(), v.finite())),
	"policies": packedOptionalJsonObjectSchema,
});
export const adminRolesUpdateOutput = v.void();

export const adminRolesUpdateDefaultPoliciesInput = objectInput({
	"policies": packedJsonObjectSchema,
});
export const adminRolesUpdateDefaultPoliciesOutput = v.void();

export const adminRolesUsersInput = objectInput({
	"roleId": misskeyId,
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
});
export const adminRolesUsersOutput = v.array(v.strictObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
		"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
		"user": packedUserDetailedSchema,
		"expiresAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	}));

export const rolesListInput = objectInput({});
export const rolesListOutput = v.array(roleSchema);

export const rolesNotesInput = objectInput({
	"roleId": misskeyId,
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const rolesNotesOutput = v.array(packedNoteSchema);

export const rolesShowInput = objectInput({
	"roleId": misskeyId,
});
export const rolesShowOutput = roleSchema;

export const rolesUsersInput = objectInput({
	"roleId": misskeyId,
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
});
export const rolesUsersOutput = v.array(v.strictObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
		"user": packedUserDetailedSchema,
	}));

export const rolesInputs = {
 adminRolesAssign: adminRolesAssignInput,
 adminRolesCreate: adminRolesCreateInput,
 adminRolesDelete: adminRolesDeleteInput,
 adminRolesList: adminRolesListInput,
 adminRolesShow: adminRolesShowInput,
 adminRolesUnassign: adminRolesUnassignInput,
 adminRolesUpdate: adminRolesUpdateInput,
 adminRolesUpdateDefaultPolicies: adminRolesUpdateDefaultPoliciesInput,
 adminRolesUsers: adminRolesUsersInput,
 rolesList: rolesListInput,
 rolesNotes: rolesNotesInput,
 rolesShow: rolesShowInput,
 rolesUsers: rolesUsersInput,
};
export const rolesOutputs = {
 adminRolesAssign: adminRolesAssignOutput,
 adminRolesCreate: adminRolesCreateOutput,
 adminRolesDelete: adminRolesDeleteOutput,
 adminRolesList: adminRolesListOutput,
 adminRolesShow: adminRolesShowOutput,
 adminRolesUnassign: adminRolesUnassignOutput,
 adminRolesUpdate: adminRolesUpdateOutput,
 adminRolesUpdateDefaultPolicies: adminRolesUpdateDefaultPoliciesOutput,
 adminRolesUsers: adminRolesUsersOutput,
 rolesList: rolesListOutput,
 rolesNotes: rolesNotesOutput,
 rolesShow: rolesShowOutput,
 rolesUsers: rolesUsersOutput,
};
