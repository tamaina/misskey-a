/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../api/backend/transport/policy.types.js';

import * as v from 'valibot';
import type { OpenAPI } from '@orpc/contract';
import { oc } from '@orpc/contract';
import { apiErrorData, commonErrors } from '../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../api/backend/transport/input.schema.js';

const apiSchemaDate = v.pipe(v.string(), v.metadata({ format: 'date-time' }));

const apiSchemaIcon = v.picklist(['info', 'warning', 'error', 'success']);

const apiSchemaDisplay = v.picklist(['normal', 'banner', 'dialog']);

export const announcementOutput = v.strictObject({
	id: v.string(), createdAt: apiSchemaDate, updatedAt: v.nullable(apiSchemaDate),
	title: v.string(), text: v.string(), imageUrl: v.nullable(v.string()), icon: apiSchemaIcon, display: apiSchemaDisplay,
	needConfirmationToRead: v.boolean(), silence: v.boolean(), forYou: v.boolean(),
	isRead: v.optional(v.boolean()),
});

const apiContractDate = v.pipe(v.string(), v.metadata({ format: 'date-time' }));

const id = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

const nonempty = v.pipe(v.string(), v.minLength(1));

const pagination = {
	limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
	sinceId: v.exactOptional(id), untilId: v.exactOptional(id),
	sinceDate: v.exactOptional(v.pipe(v.number(), v.integer())),
	untilDate: v.exactOptional(v.pipe(v.number(), v.integer())),
};

const apiContractIcon = v.picklist(['info', 'warning', 'error', 'success']);

const apiContractDisplay = v.picklist(['normal', 'banner', 'dialog']);

const publicSecurity: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];

export const announcementsContract = {
	create: oc.$meta({
		requestName: 'admin/announcements/create',
		requireCredential: true,
		requireModerator: true,
		kind: 'write:admin:announcements',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/admin/announcements/create', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(objectInput({
			title: nonempty, text: nonempty, imageUrl: v.nullable(v.string()),
			icon: v.optional(apiContractIcon, 'info'), display: v.optional(apiContractDisplay, 'normal'),
			forExistingUsers: v.optional(v.boolean(), false), silence: v.optional(v.boolean(), false),
			needConfirmationToRead: v.optional(v.boolean(), false), userId: v.optional(v.nullable(id), null),
		})).output(announcementOutput),
	delete: oc.$meta({
		requestName: 'admin/announcements/delete',
		requireCredential: true,
		requireModerator: true,
		kind: 'write:admin:announcements',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/admin/announcements/delete', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_ANNOUNCEMENT: { status: 400, data: apiErrorData } })
		.input(objectInput({ id })).output(v.void()),
	adminList: oc.$meta({
		requestName: 'admin/announcements/list',
		requireCredential: true,
		requireModerator: true,
		kind: 'read:admin:announcements',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/admin/announcements/list', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(objectInput({
			...pagination, userId: v.exactOptional(v.nullable(id)), status: v.optional(v.picklist(['all', 'active', 'archived']), 'active'),
		})).output(v.array(v.strictObject({
	id: v.string(), createdAt: apiContractDate, updatedAt: v.nullable(apiContractDate), title: v.string(), text: v.string(),
	imageUrl: v.nullable(v.string()), icon: apiContractIcon, display: apiContractDisplay, isActive: v.boolean(), forExistingUsers: v.boolean(),
	silence: v.boolean(), needConfirmationToRead: v.boolean(), userId: v.nullable(v.string()), reads: v.number(),
}))),
	update: oc.$meta({
		requestName: 'admin/announcements/update',
		requireCredential: true,
		requireModerator: true,
		kind: 'write:admin:announcements',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/admin/announcements/update', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_ANNOUNCEMENT: { status: 400, data: apiErrorData } })
		.input(objectInput({
			id, title: v.exactOptional(nonempty), text: v.exactOptional(nonempty),
			imageUrl: v.exactOptional(v.nullable(v.string())), icon: v.exactOptional(apiContractIcon), display: v.exactOptional(apiContractDisplay),
			forExistingUsers: v.exactOptional(v.boolean()), silence: v.exactOptional(v.boolean()),
			needConfirmationToRead: v.exactOptional(v.boolean()), isActive: v.exactOptional(v.boolean()),
		})).output(v.void()),
	list: oc.$meta({
		requestName: 'announcements',
		requireCredential: false,
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/announcements', tags: ['meta'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(objectInput({ ...pagination, isActive: v.optional(v.boolean(), true) })).output(v.array(announcementOutput)),
	show: oc.$meta({
		requestName: 'announcements/show',
		requireCredential: false,
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/announcements/show', tags: ['meta'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors, NO_SUCH_ANNOUNCEMENT: { status: 400, data: apiErrorData } })
		.input(objectInput({ announcementId: id })).output(announcementOutput),
	read: oc.$meta({
		requestName: 'i/read-announcement',
		requireCredential: true,
		kind: 'write:account',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/i/read-announcement', tags: ['account'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(objectInput({ announcementId: id })).output(v.void()),
};
