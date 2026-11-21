/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { OpenAPI } from '@orpc/contract';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../api/backend/transport/input.schema.js';
import type { ApiProcedureMetadata } from '../../api/backend/transport/policy.types.js';
const id = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));
const nonempty = v.pipe(v.string(), v.minLength(1));
const date = v.pipe(v.string(), v.metadata({ format: 'date-time' }));
const pagination = {
	limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
	sinceId: v.exactOptional(id), untilId: v.exactOptional(id),
	sinceDate: v.exactOptional(v.pipe(v.number(), v.integer())),
	untilDate: v.exactOptional(v.pipe(v.number(), v.integer())),
};
const decorationFields = {
	id: v.string(), name: v.string(), description: v.string(), url: v.string(),
	roleIdsThatCanBeUsedThisDecoration: v.array(v.string()),
};

const publicSecurity: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];

export const avatarDecorationsContract = {
	create: oc.$meta({
		requestName: 'admin/avatar-decorations/create',
		requireCredential: true,
		requiredRolePolicy: 'canManageAvatarDecorations',
		kind: 'write:admin:avatar-decorations',
	} as const satisfies ApiProcedureMetadata)
		.route({ method: 'POST', path: '/admin/avatar-decorations/create', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(objectInput({
			name: nonempty, description: v.string(), url: nonempty,
			roleIdsThatCanBeUsedThisDecoration: v.exactOptional(v.array(v.string())),
			category: v.exactOptional(v.nullable(v.string())),
		})).output(v.strictObject({
	...decorationFields, createdAt: date, updatedAt: v.nullable(date), category: v.nullable(v.string()),
})),
	delete: oc.$meta({
		requestName: 'admin/avatar-decorations/delete',
		requireCredential: true,
		requiredRolePolicy: 'canManageAvatarDecorations',
		kind: 'write:admin:avatar-decorations',
	} as const satisfies ApiProcedureMetadata)
		.route({ method: 'POST', path: '/admin/avatar-decorations/delete', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(objectInput({ id })).output(v.void()),
	list: oc.$meta({
		requestName: 'admin/avatar-decorations/list',
		requireCredential: true,
		requiredRolePolicy: 'canManageAvatarDecorations',
		kind: 'read:admin:avatar-decorations',
	} as const satisfies ApiProcedureMetadata)
		.route({ method: 'POST', path: '/admin/avatar-decorations/list', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(objectInput({ ...pagination, userId: v.exactOptional(v.nullable(id)) })).output(v.array(v.strictObject({
			...decorationFields, createdAt: date, updatedAt: v.nullable(date), category: v.exactOptional(v.nullable(v.string())),
		}))),
	update: oc.$meta({
		requestName: 'admin/avatar-decorations/update',
		requireCredential: true,
		requiredRolePolicy: 'canManageAvatarDecorations',
		kind: 'write:admin:avatar-decorations',
	} as const satisfies ApiProcedureMetadata)
		.route({ method: 'POST', path: '/admin/avatar-decorations/update', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(objectInput({
			id, name: v.exactOptional(nonempty), description: v.exactOptional(v.string()), url: v.exactOptional(nonempty),
			roleIdsThatCanBeUsedThisDecoration: v.exactOptional(v.array(v.string())),
			category: v.exactOptional(v.nullable(v.string())),
		})).output(v.void()),
	get: oc.$meta({
		requestName: 'get-avatar-decorations',
		requireCredential: false,
	} as const satisfies ApiProcedureMetadata)
		.route({ method: 'POST', path: '/get-avatar-decorations', tags: ['users'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(v.optional(objectInput({}), {})).output(v.array(v.strictObject({
			...decorationFields, category: v.exactOptional(v.nullable(v.string())),
		}))),
};
