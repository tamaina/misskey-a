/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { apiErrorData, commonErrors } from '../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../api/backend/transport/input.schema.js';
import { emojiSimpleResult, emojiDetailedResult, packedEmojiDetailedAdminSchema, fetchEmojisHostTypes, fetchEmojisSortKeys } from './api.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));
const updateCommon = {
	fileId: v.optional(misskeyId), category: v.optional(v.nullable(v.string())), aliases: v.optional(v.array(v.string())),
	license: v.optional(v.nullable(v.string())), isSensitive: v.optional(v.boolean()), localOnly: v.optional(v.boolean()),
	roleIdsThatCanBeUsedThisEmojiAsReaction: v.optional(v.array(v.string())),
};
import type { OpenAPI } from '@orpc/contract';

const publicSecurity: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];

export const emojisContract = {
	add: oc.$meta({ requestName: 'admin/emoji/add' } as const)
		.route({ method: 'POST', path: '/admin/emoji/add', operationId: 'post___admin___emoji___add', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
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
	addAliasesBulk: oc.$meta({ requestName: 'admin/emoji/add-aliases-bulk' } as const)
		.route({ method: 'POST', path: '/admin/emoji/add-aliases-bulk', operationId: 'post___admin___emoji___add-aliases-bulk', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(objectInput({ ids: v.array(misskeyId), aliases: v.array(v.string()) })).output(v.void()),
	copy: oc.$meta({ requestName: 'admin/emoji/copy' } as const)
		.route({ method: 'POST', path: '/admin/emoji/copy', operationId: 'post___admin___emoji___copy', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors, NO_SUCH_EMOJI: { status: 400, data: apiErrorData }, DUPLICATE_NAME: { status: 400, data: apiErrorData } })
		.input(objectInput({
	'emojiId': misskeyId,
})).output(emojiDetailedResult),
	delete: oc.$meta({ requestName: 'admin/emoji/delete' } as const)
		.route({ method: 'POST', path: '/admin/emoji/delete', operationId: 'post___admin___emoji___delete', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_EMOJI: { status: 400, data: apiErrorData } })
		.input(objectInput({
	'id': misskeyId,
})).output(v.void()),
	deleteBulk: oc.$meta({ requestName: 'admin/emoji/delete-bulk' } as const)
		.route({ method: 'POST', path: '/admin/emoji/delete-bulk', operationId: 'post___admin___emoji___delete-bulk', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(objectInput({
	'ids': v.array(misskeyId),
})).output(v.void()),
	importZip: oc.$meta({ requestName: 'admin/emoji/import-zip' } as const)
		.route({ method: 'POST', path: '/admin/emoji/import-zip', operationId: 'post___admin___emoji___import-zip', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(objectInput({
	'fileId': misskeyId,
})).output(v.void()),
	list: oc.$meta({ requestName: 'admin/emoji/list' } as const)
		.route({ method: 'POST', path: '/admin/emoji/list', operationId: 'post___admin___emoji___list', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(objectInput({
	'query': v.optional(v.nullable(v.string()), null),
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
})).output(v.array(emojiDetailedResult)),
	listRemote: oc.$meta({ requestName: 'admin/emoji/list-remote' } as const)
		.route({ method: 'POST', path: '/admin/emoji/list-remote', operationId: 'post___admin___emoji___list-remote', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
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
	removeAliasesBulk: oc.$meta({ requestName: 'admin/emoji/remove-aliases-bulk' } as const)
		.route({ method: 'POST', path: '/admin/emoji/remove-aliases-bulk', operationId: 'post___admin___emoji___remove-aliases-bulk', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(objectInput({ ids: v.array(misskeyId), aliases: v.array(v.string()) })).output(v.void()),
	setAliasesBulk: oc.$meta({ requestName: 'admin/emoji/set-aliases-bulk' } as const)
		.route({ method: 'POST', path: '/admin/emoji/set-aliases-bulk', operationId: 'post___admin___emoji___set-aliases-bulk', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(objectInput({ ids: v.array(misskeyId), aliases: v.array(v.string()) })).output(v.void()),
	setCategoryBulk: oc.$meta({ requestName: 'admin/emoji/set-category-bulk' } as const)
		.route({ method: 'POST', path: '/admin/emoji/set-category-bulk', operationId: 'post___admin___emoji___set-category-bulk', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(objectInput({ ids: v.array(misskeyId), category: v.exactOptional(v.nullable(v.string())) })).output(v.void()),
	setLicenseBulk: oc.$meta({ requestName: 'admin/emoji/set-license-bulk' } as const)
		.route({ method: 'POST', path: '/admin/emoji/set-license-bulk', operationId: 'post___admin___emoji___set-license-bulk', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(objectInput({ ids: v.array(misskeyId), license: v.exactOptional(v.nullable(v.string())) })).output(v.void()),
	update: oc.$meta({ requestName: 'admin/emoji/update' } as const)
		.route({ method: 'POST', path: '/admin/emoji/update', operationId: 'post___admin___emoji___update', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_EMOJI: { status: 400, data: apiErrorData }, NO_SUCH_FILE: { status: 400, data: apiErrorData }, SAME_NAME_EMOJI_EXISTS: { status: 400, data: apiErrorData } })
		.input(v.union([
	objectInput({ id: misskeyId, name: v.optional(v.string()), ...updateCommon }),
	objectInput({ name: v.pipe(v.string(), v.regex(/^[a-zA-Z0-9_]+$/)), ...updateCommon }),
])).output(v.void()),
	emoji: oc.$meta({ requestName: 'emoji', allowGet: true, cacheSec: 3600 } as const)
		.route({ method: 'POST', path: '/emoji', operationId: 'post___emoji', tags: ['meta'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(objectInput({ name: v.string() })).output(emojiDetailedResult),
	emojis: oc.$meta({ requestName: 'emojis', allowGet: true, cacheSec: 3600 } as const)
		.route({ method: 'POST', path: '/emojis', operationId: 'post___emojis', tags: ['meta'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(v.optional(objectInput({}), {})).output(v.strictObject({ emojis: v.array(emojiSimpleResult) })),
	emojiGet: oc.$meta({ allowGet: true, cacheSec: 3600 } as const)
		.route({ method: 'GET', path: '/emoji', operationId: 'get___emoji', tags: ['meta'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(objectInput({ name: v.string() })).output(emojiDetailedResult),
	emojisGet: oc.$meta({ allowGet: true, cacheSec: 3600 } as const)
		.route({ method: 'GET', path: '/emojis', operationId: 'get___emojis', tags: ['meta'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(v.optional(objectInput({}), {})).output(v.strictObject({ emojis: v.array(emojiSimpleResult) })),
	exportCustomEmojis: oc.$meta({ requestName: 'export-custom-emojis' } as const)
		.route({ method: 'POST', path: '/export-custom-emojis', operationId: 'post___export-custom-emojis', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(objectInput({})).output(v.void()),
	v2List: oc.$meta({ requestName: 'v2/admin/emoji/list' } as const)
		.route({ method: 'POST', path: '/v2/admin/emoji/list', operationId: 'post___v2___admin___emoji___list', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
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
