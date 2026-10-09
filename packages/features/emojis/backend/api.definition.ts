/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../api/backend/transport/policy.types.js';
import * as v from 'valibot';
import { oc } from '@orpc/contract';
import { apiErrorData, commonErrors } from '../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../api/backend/transport/input.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const emojiSimpleResult = v.strictObject({
	aliases: v.array(v.string()),
	name: v.string(),
	category: v.nullable(v.string()),
	url: v.string(),
	localOnly: v.optional(v.boolean()),
	isSensitive: v.optional(v.boolean()),
	roleIdsThatCanBeUsedThisEmojiAsReaction: v.optional(v.array(v.string())),
});

export const emojiDetailedResult = v.strictObject({
	id: v.string(),
	aliases: v.array(v.string()),
	name: v.string(),
	category: v.nullable(v.string()),
	host: v.pipe(v.nullable(v.string()), v.metadata({ description: 'The local host is represented with `null`.' })),
	url: v.string(),
	license: v.nullable(v.string()),
	isSensitive: v.boolean(),
	localOnly: v.boolean(),
	roleIdsThatCanBeUsedThisEmojiAsReaction: v.array(v.string()),
});

export const packedEmojiDetailedAdminSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'updatedAt': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'date-time' })),
	'name': v.string(),
	'host': v.pipe(v.nullable(v.string()), v.metadata({ 'description': 'The local host is represented with `null`.' })),
	'publicUrl': v.string(),
	'originalUrl': v.string(),
	'uri': v.nullable(v.string()),
	'type': v.nullable(v.string()),
	'aliases': v.array(v.pipe(v.string(), v.metadata({ 'format': 'id' }))),
	'category': v.nullable(v.string()),
	'license': v.nullable(v.string()),
	'localOnly': v.boolean(),
	'isSensitive': v.boolean(),
	'roleIdsThatCanBeUsedThisEmojiAsReaction': v.array(v.strictObject({
		'id': v.pipe(v.string(), v.metadata({ 'format': 'misskey:id' })),
		'name': v.string(),
	})),
});

export const fetchEmojisHostTypes = [
	'local',
	'remote',
	'all',
] as const;

export const fetchEmojisSortKeys = [
	'+id',
	'-id',
	'+updatedAt',
	'-updatedAt',
	'+name',
	'-name',
	'+host',
	'-host',
	'+uri',
	'-uri',
	'+publicUrl',
	'-publicUrl',
	'+type',
	'-type',
	'+aliases',
	'-aliases',
	'+category',
	'-category',
	'+license',
	'-license',
	'+isSensitive',
	'-isSensitive',
	'+localOnly',
	'-localOnly',
	'+roleIdsThatCanBeUsedThisEmojiAsReaction',
	'-roleIdsThatCanBeUsedThisEmojiAsReaction',
] as const;

export type EmojiSimple = v.InferOutput<typeof emojiSimpleResult>;

export type EmojiDetailed = v.InferOutput<typeof emojiDetailedResult>;

const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

const updateCommon = {
	fileId: v.optional(misskeyId), category: v.optional(v.nullable(v.string())), aliases: v.optional(v.array(v.string())),
	license: v.optional(v.nullable(v.string())), isSensitive: v.optional(v.boolean()), localOnly: v.optional(v.boolean()),
	roleIdsThatCanBeUsedThisEmojiAsReaction: v.optional(v.array(v.string())),
};

const publicSecurity: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];

export const emojisContract = {
	add: oc.$meta({
		requestName: 'admin/emoji/add',
		requireCredential: true,
		requiredRolePolicy: 'canManageCustomEmojis',
		kind: 'write:admin:emoji',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/admin/emoji/add', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors, NO_SUCH_FILE: { status: 400, data: apiErrorData }, UNSUPPORTED_FILE_TYPE: { status: 400, data: apiErrorData }, DUPLICATE_NAME: { status: 400, data: apiErrorData } })
		.input(objectInput({
	'name': v.pipe(v.string(), v.regex(new RegExp('^[a-zA-Z0-9_]+$'))),
	'fileId': misskeyId,
	'category': v.exactOptional(v.pipe(v.nullable(v.string()), v.metadata({ 'description': 'Use `null` to reset the category.' }))),
	'aliases': v.exactOptional(v.array(v.string())),
	'license': v.exactOptional(v.nullable(v.string())),
	'isSensitive': v.exactOptional(v.boolean()),
	'localOnly': v.exactOptional(v.boolean()),
	'roleIdsThatCanBeUsedThisEmojiAsReaction': v.exactOptional(v.array(v.string())),
})).output(emojiDetailedResult),
	addAliasesBulk: oc.$meta({
		requestName: 'admin/emoji/add-aliases-bulk',
		requireCredential: true,
		requiredRolePolicy: 'canManageCustomEmojis',
		kind: 'write:admin:emoji',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/admin/emoji/add-aliases-bulk', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(objectInput({ ids: v.array(misskeyId), aliases: v.array(v.string()) })).output(v.void()),
	copy: oc.$meta({
		requestName: 'admin/emoji/copy',
		requireCredential: true,
		requiredRolePolicy: 'canManageCustomEmojis',
		kind: 'write:admin:emoji',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/admin/emoji/copy', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors, NO_SUCH_EMOJI: { status: 400, data: apiErrorData }, DUPLICATE_NAME: { status: 400, data: apiErrorData } })
		.input(objectInput({
	'emojiId': misskeyId,
})).output(emojiDetailedResult),
	delete: oc.$meta({
		requestName: 'admin/emoji/delete',
		requireCredential: true,
		requiredRolePolicy: 'canManageCustomEmojis',
		kind: 'write:admin:emoji',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/admin/emoji/delete', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_EMOJI: { status: 400, data: apiErrorData } })
		.input(objectInput({
	'id': misskeyId,
})).output(v.void()),
	deleteBulk: oc.$meta({
		requestName: 'admin/emoji/delete-bulk',
		requireCredential: true,
		requiredRolePolicy: 'canManageCustomEmojis',
		kind: 'write:admin:emoji',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/admin/emoji/delete-bulk', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(objectInput({
	'ids': v.array(misskeyId),
})).output(v.void()),
	importZip: oc.$meta({
		requestName: 'admin/emoji/import-zip',
		requireCredential: true,
		requireAdmin: true,
		secure: true,
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/admin/emoji/import-zip', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(objectInput({
	'fileId': misskeyId,
})).output(v.void()),
	list: oc.$meta({
		requestName: 'admin/emoji/list',
		requireCredential: true,
		requiredRolePolicy: 'canManageCustomEmojis',
		kind: 'read:admin:emoji',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/admin/emoji/list', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(objectInput({
	'query': v.optional(v.nullable(v.string()), null),
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
})).output(v.array(emojiDetailedResult)),
	listRemote: oc.$meta({
		requestName: 'admin/emoji/list-remote',
		requireCredential: true,
		requiredRolePolicy: 'canManageCustomEmojis',
		kind: 'read:admin:emoji',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/admin/emoji/list-remote', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(objectInput({
	'query': v.optional(v.nullable(v.string()), null),
	'host': v.optional(v.pipe(v.nullable(v.string()), v.metadata({ 'description': 'Use `null` to represent the local host.' })), null),
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
})).output(v.array(emojiDetailedResult)),
	removeAliasesBulk: oc.$meta({
		requestName: 'admin/emoji/remove-aliases-bulk',
		requireCredential: true,
		requiredRolePolicy: 'canManageCustomEmojis',
		kind: 'write:admin:emoji',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/admin/emoji/remove-aliases-bulk', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(objectInput({ ids: v.array(misskeyId), aliases: v.array(v.string()) })).output(v.void()),
	setAliasesBulk: oc.$meta({
		requestName: 'admin/emoji/set-aliases-bulk',
		requireCredential: true,
		requiredRolePolicy: 'canManageCustomEmojis',
		kind: 'write:admin:emoji',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/admin/emoji/set-aliases-bulk', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(objectInput({ ids: v.array(misskeyId), aliases: v.array(v.string()) })).output(v.void()),
	setCategoryBulk: oc.$meta({
		requestName: 'admin/emoji/set-category-bulk',
		requireCredential: true,
		requiredRolePolicy: 'canManageCustomEmojis',
		kind: 'write:admin:emoji',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/admin/emoji/set-category-bulk', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(objectInput({ ids: v.array(misskeyId), category: v.exactOptional(v.nullable(v.string())) })).output(v.void()),
	setLicenseBulk: oc.$meta({
		requestName: 'admin/emoji/set-license-bulk',
		requireCredential: true,
		requiredRolePolicy: 'canManageCustomEmojis',
		kind: 'write:admin:emoji',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/admin/emoji/set-license-bulk', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(objectInput({ ids: v.array(misskeyId), license: v.exactOptional(v.nullable(v.string())) })).output(v.void()),
	update: oc.$meta({
		requestName: 'admin/emoji/update',
		requireCredential: true,
		requiredRolePolicy: 'canManageCustomEmojis',
		kind: 'write:admin:emoji',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/admin/emoji/update', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_EMOJI: { status: 400, data: apiErrorData }, NO_SUCH_FILE: { status: 400, data: apiErrorData }, SAME_NAME_EMOJI_EXISTS: { status: 400, data: apiErrorData } })
		.input(v.union([
	objectInput({ id: misskeyId, name: v.optional(v.string()), ...updateCommon }),
	objectInput({ name: v.pipe(v.string(), v.regex(/^[a-zA-Z0-9_]+$/)), ...updateCommon }),
])).output(v.void()),
	emoji: oc.$meta({
		requestName: 'emoji',
		allowGet: true,
		cacheSec: 3600,
		requireCredential: false,
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/emoji', tags: ['meta'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(objectInput({ name: v.string() })).output(emojiDetailedResult),
	emojis: oc.$meta({
		requestName: 'emojis',
		allowGet: true,
		cacheSec: 3600,
		requireCredential: false,
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/emojis', tags: ['meta'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(v.optional(objectInput({}), {})).output(v.strictObject({ emojis: v.array(emojiSimpleResult) })),
	emojiGet: oc.$meta({
		allowGet: true,
		cacheSec: 3600,
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'GET', path: '/emoji', tags: ['meta'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(objectInput({ name: v.string() })).output(emojiDetailedResult),
	emojisGet: oc.$meta({
		allowGet: true,
		cacheSec: 3600,
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'GET', path: '/emojis', tags: ['meta'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(v.optional(objectInput({}), {})).output(v.strictObject({ emojis: v.array(emojiSimpleResult) })),
	exportCustomEmojis: oc.$meta({
		requestName: 'export-custom-emojis',
		requireCredential: true,
		secure: true,
		limit: {
			duration: 3600000,
			max: 1,
		},
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/export-custom-emojis', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(objectInput({})).output(v.void()),
	v2List: oc.$meta({
		requestName: 'v2/admin/emoji/list',
		requireCredential: true,
		requiredRolePolicy: 'canManageCustomEmojis',
		kind: 'read:admin:emoji',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/v2/admin/emoji/list', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(objectInput({
	'query': v.exactOptional(v.pipe(v.nullable(objectInput({
		'updatedAtFrom': v.exactOptional(v.string()),
		'updatedAtTo': v.exactOptional(v.string()),
		'name': v.exactOptional(v.string()),
		'host': v.exactOptional(v.string()),
		'uri': v.exactOptional(v.string()),
		'publicUrl': v.exactOptional(v.string()),
		'originalUrl': v.exactOptional(v.string()),
		'type': v.exactOptional(v.string()),
		'aliases': v.exactOptional(v.string()),
		'category': v.exactOptional(v.string()),
		'license': v.exactOptional(v.string()),
		'isSensitive': v.exactOptional(v.boolean()),
		'localOnly': v.exactOptional(v.boolean()),
		'hostType': v.optional(v.picklist(fetchEmojisHostTypes), 'all'),
		'roleIds': v.exactOptional(v.array(misskeyId)),
	})), v.metadata({ 'required': undefined }))),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'limit': v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
	'page': v.exactOptional(v.pipe(v.number(), v.integer())),
	'sortKeys': v.optional(v.array(v.picklist(fetchEmojisSortKeys)), ['-id']),
})).output(v.strictObject({ emojis: v.array(packedEmojiDetailedAdminSchema), count: v.pipe(v.number(), v.integer()), allCount: v.pipe(v.number(), v.integer()), allPages: v.pipe(v.number(), v.integer()) })),
};
