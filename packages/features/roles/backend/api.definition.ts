/*
	* SPDX-FileCopyrightText: syuilo and misskey-project
	* SPDX-License-Identifier: AGPL-3.0-only
	*/

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../api/backend/transport/policy.types.js';
import * as v from 'valibot';
import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import { commonErrors, apiErrorData } from '../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../api/backend/transport/input.schema.js';
import { packedUserDetailedSchema } from '../../users/backend/user.schema.js';
import { roleSchema } from '../../roles/backend/role.schema.js';
import { packedJsonObjectSchema, packedOptionalJsonObjectSchema } from '../../users/backend/json-value.schema.js';
import { packedNoteSchema } from '../../notes/backend/note.schema.js';

const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

const publicSecurity: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];

export const rolesContract = {
	adminRolesAssign: oc.$meta({
		requestName: 'admin/roles/assign',
		requireCredential: true,
		requireModerator: true,
		kind: 'write:admin:roles',
	} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/admin/roles/assign', tags: ['admin', 'role'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_ROLE: { status: 400, data: apiErrorData }, NO_SUCH_USER: { status: 400, data: apiErrorData }, ACCESS_DENIED: { status: 400, data: apiErrorData } }).input(objectInput({
	"roleId": misskeyId,
	"userId": misskeyId,
	"expiresAt": v.exactOptional(v.nullable(v.pipe(v.number(), v.integer()))),
})).output(v.void()),
	adminRolesCreate: oc.$meta({
		requestName: 'admin/roles/create',
		requireCredential: true,
		requireAdmin: true,
		kind: 'write:admin:roles',
	} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/admin/roles/create', tags: ['admin', 'role'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(objectInput({
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
})).output(roleSchema),
	adminRolesDelete: oc.$meta({
		requestName: 'admin/roles/delete',
		requireCredential: true,
		requireAdmin: true,
		kind: 'write:admin:roles',
	} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/admin/roles/delete', tags: ['admin', 'role'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_ROLE: { status: 400, data: apiErrorData } }).input(objectInput({
	"roleId": misskeyId,
})).output(v.void()),
	adminRolesList: oc.$meta({
		requestName: 'admin/roles/list',
		requireCredential: true,
		requireModerator: true,
		kind: 'read:admin:roles',
	} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/admin/roles/list', tags: ['admin', 'role'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(objectInput({})).output(v.array(roleSchema)),
	adminRolesShow: oc.$meta({
		requestName: 'admin/roles/show',
		requireCredential: true,
		requireModerator: true,
		kind: 'read:admin:roles',
	} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/admin/roles/show', tags: ['admin', 'role'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_ROLE: { status: 400, data: apiErrorData } }).input(objectInput({
	"roleId": misskeyId,
})).output(roleSchema),
	adminRolesUnassign: oc.$meta({
		requestName: 'admin/roles/unassign',
		requireCredential: true,
		requireModerator: true,
		kind: 'write:admin:roles',
	} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/admin/roles/unassign', tags: ['admin', 'role'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_ROLE: { status: 400, data: apiErrorData }, NO_SUCH_USER: { status: 400, data: apiErrorData }, NOT_ASSIGNED: { status: 400, data: apiErrorData }, ACCESS_DENIED: { status: 400, data: apiErrorData } }).input(objectInput({
	"roleId": misskeyId,
	"userId": misskeyId,
})).output(v.void()),
	adminRolesUpdate: oc.$meta({
		requestName: 'admin/roles/update',
		requireCredential: true,
		requireAdmin: true,
		kind: 'write:admin:roles',
	} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/admin/roles/update', tags: ['admin', 'role'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_ROLE: { status: 400, data: apiErrorData } }).input(objectInput({
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
})).output(v.void()),
	adminRolesUpdateDefaultPolicies: oc.$meta({
		requestName: 'admin/roles/update-default-policies',
		requireCredential: true,
		requireAdmin: true,
		kind: 'write:admin:roles',
	} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/admin/roles/update-default-policies', tags: ['admin', 'role'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors }).input(objectInput({
	"policies": packedJsonObjectSchema,
})).output(v.void()),
	adminRolesUsers: oc.$meta({
		requestName: 'admin/roles/users',
		requireCredential: false,
		requireModerator: true,
		kind: 'read:admin:roles',
	} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/admin/roles/users', tags: ['admin', 'role', 'users'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_ROLE: { status: 400, data: apiErrorData } }).input(objectInput({
	"roleId": misskeyId,
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
})).output(v.array(v.strictObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
		"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
		"user": packedUserDetailedSchema,
		"expiresAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	}))),
	rolesList: oc.$meta({
		requestName: 'roles/list',
		requireCredential: true,
		kind: 'read:account',
	} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/roles/list', tags: ['role'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(objectInput({})).output(v.array(roleSchema)),
	rolesNotes: oc.$meta({
		requestName: 'roles/notes',
		requireCredential: true,
		kind: 'read:account',
	} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/roles/notes', tags: ['role', 'notes'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_ROLE: { status: 400, data: apiErrorData } }).input(objectInput({
	"roleId": misskeyId,
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
})).output(v.array(packedNoteSchema)),
	rolesShow: oc.$meta({
		requestName: 'roles/show',
		requireCredential: false,
	} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/roles/show', tags: ['role', 'users'], spec: current => ({ ...current, security: publicSecurity }) })
	.errors({ ...commonErrors, NO_SUCH_ROLE: { status: 400, data: apiErrorData } }).input(objectInput({
	"roleId": misskeyId,
})).output(roleSchema),
	rolesUsers: oc.$meta({
		requestName: 'roles/users',
		requireCredential: false,
	} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/roles/users', tags: ['role', 'users'], spec: current => ({ ...current, security: publicSecurity }) })
	.errors({ ...commonErrors, NO_SUCH_ROLE: { status: 400, data: apiErrorData } }).input(objectInput({
	"roleId": misskeyId,
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
})).output(v.array(v.strictObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
		"user": packedUserDetailedSchema,
	}))),
};
