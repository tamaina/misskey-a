/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { apiErrorData, commonErrors } from '../../api/backend/transport/errors.schema.js';
import * as s from './api.schema.js';

const publicSecurity: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];

export const emojisContract = {
	add: oc.$meta<{ requestName: 'admin/emoji/add' }>({ requestName: 'admin/emoji/add' })
		.route({ method: 'POST', path: '/admin/emoji/add', operationId: 'post___admin___emoji___add', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors, NO_SUCH_FILE: { status: 400, data: apiErrorData }, UNSUPPORTED_FILE_TYPE: { status: 400, data: apiErrorData }, DUPLICATE_NAME: { status: 400, data: apiErrorData } })
		.input(s.packedAdminEmojiAddInput).output(s.emojiDetailedResult),
	addAliasesBulk: oc.$meta<{ requestName: 'admin/emoji/add-aliases-bulk' }>({ requestName: 'admin/emoji/add-aliases-bulk' })
		.route({ method: 'POST', path: '/admin/emoji/add-aliases-bulk', operationId: 'post___admin___emoji___add-aliases-bulk', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(s.emojiAliasesBulkInput).output(v.void()),
	copy: oc.$meta<{ requestName: 'admin/emoji/copy' }>({ requestName: 'admin/emoji/copy' })
		.route({ method: 'POST', path: '/admin/emoji/copy', operationId: 'post___admin___emoji___copy', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors, NO_SUCH_EMOJI: { status: 400, data: apiErrorData }, DUPLICATE_NAME: { status: 400, data: apiErrorData } })
		.input(s.inlineAdminEmojiCopyInput).output(s.emojiDetailedResult),
	delete: oc.$meta<{ requestName: 'admin/emoji/delete' }>({ requestName: 'admin/emoji/delete' })
		.route({ method: 'POST', path: '/admin/emoji/delete', operationId: 'post___admin___emoji___delete', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_EMOJI: { status: 400, data: apiErrorData } })
		.input(s.voidAdminEmojiDeleteInput).output(v.void()),
	deleteBulk: oc.$meta<{ requestName: 'admin/emoji/delete-bulk' }>({ requestName: 'admin/emoji/delete-bulk' })
		.route({ method: 'POST', path: '/admin/emoji/delete-bulk', operationId: 'post___admin___emoji___delete-bulk', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(s.voidAdminEmojiDeleteBulkInput).output(v.void()),
	importZip: oc.$meta<{ requestName: 'admin/emoji/import-zip' }>({ requestName: 'admin/emoji/import-zip' })
		.route({ method: 'POST', path: '/admin/emoji/import-zip', operationId: 'post___admin___emoji___import-zip', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(s.voidAdminEmojiImportZipInput).output(v.void()),
	list: oc.$meta<{ requestName: 'admin/emoji/list' }>({ requestName: 'admin/emoji/list' })
		.route({ method: 'POST', path: '/admin/emoji/list', operationId: 'post___admin___emoji___list', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(s.packedAdminEmojiListInput).output(v.array(s.emojiDetailedResult)),
	listRemote: oc.$meta<{ requestName: 'admin/emoji/list-remote' }>({ requestName: 'admin/emoji/list-remote' })
		.route({ method: 'POST', path: '/admin/emoji/list-remote', operationId: 'post___admin___emoji___list-remote', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(s.packedAdminEmojiListRemoteInput).output(v.array(s.emojiDetailedResult)),
	removeAliasesBulk: oc.$meta<{ requestName: 'admin/emoji/remove-aliases-bulk' }>({ requestName: 'admin/emoji/remove-aliases-bulk' })
		.route({ method: 'POST', path: '/admin/emoji/remove-aliases-bulk', operationId: 'post___admin___emoji___remove-aliases-bulk', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(s.emojiAliasesBulkInput).output(v.void()),
	setAliasesBulk: oc.$meta<{ requestName: 'admin/emoji/set-aliases-bulk' }>({ requestName: 'admin/emoji/set-aliases-bulk' })
		.route({ method: 'POST', path: '/admin/emoji/set-aliases-bulk', operationId: 'post___admin___emoji___set-aliases-bulk', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(s.emojiAliasesBulkInput).output(v.void()),
	setCategoryBulk: oc.$meta<{ requestName: 'admin/emoji/set-category-bulk' }>({ requestName: 'admin/emoji/set-category-bulk' })
		.route({ method: 'POST', path: '/admin/emoji/set-category-bulk', operationId: 'post___admin___emoji___set-category-bulk', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(s.emojiCategoryBulkInput).output(v.void()),
	setLicenseBulk: oc.$meta<{ requestName: 'admin/emoji/set-license-bulk' }>({ requestName: 'admin/emoji/set-license-bulk' })
		.route({ method: 'POST', path: '/admin/emoji/set-license-bulk', operationId: 'post___admin___emoji___set-license-bulk', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(s.emojiLicenseBulkInput).output(v.void()),
	update: oc.$meta<{ requestName: 'admin/emoji/update' }>({ requestName: 'admin/emoji/update' })
		.route({ method: 'POST', path: '/admin/emoji/update', operationId: 'post___admin___emoji___update', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_EMOJI: { status: 400, data: apiErrorData }, NO_SUCH_FILE: { status: 400, data: apiErrorData }, SAME_NAME_EMOJI_EXISTS: { status: 400, data: apiErrorData } })
		.input(s.emojiUpdateInput).output(v.void()),
	emoji: oc.$meta<{ requestName: 'emoji'; allowGet: true; cacheSec: 3600 }>({ requestName: 'emoji', allowGet: true, cacheSec: 3600 })
		.route({ method: 'POST', path: '/emoji', operationId: 'post___emoji', tags: ['meta'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(s.emojiInput).output(s.emojiDetailedResult),
	emojis: oc.$meta<{ requestName: 'emojis'; allowGet: true; cacheSec: 3600 }>({ requestName: 'emojis', allowGet: true, cacheSec: 3600 })
		.route({ method: 'POST', path: '/emojis', operationId: 'post___emojis', tags: ['meta'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(s.emojisInput).output(s.emojisResult),
	emojiGet: oc.$meta<{ allowGet: true; cacheSec: 3600 }>({ allowGet: true, cacheSec: 3600 })
		.route({ method: 'GET', path: '/emoji', operationId: 'get___emoji', tags: ['meta'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(s.emojiInput).output(s.emojiDetailedResult),
	emojisGet: oc.$meta<{ allowGet: true; cacheSec: 3600 }>({ allowGet: true, cacheSec: 3600 })
		.route({ method: 'GET', path: '/emojis', operationId: 'get___emojis', tags: ['meta'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(s.emojisInput).output(s.emojisResult),
	exportCustomEmojis: oc.$meta<{ requestName: 'export-custom-emojis' }>({ requestName: 'export-custom-emojis' })
		.route({ method: 'POST', path: '/export-custom-emojis', operationId: 'post___export-custom-emojis', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(s.voidExportCustomEmojisInput).output(v.void()),
	v2List: oc.$meta<{ requestName: 'v2/admin/emoji/list' }>({ requestName: 'v2/admin/emoji/list' })
		.route({ method: 'POST', path: '/v2/admin/emoji/list', operationId: 'post___v2___admin___emoji___list', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(s.portableV2AdminEmojiListInput).output(s.v2EmojiListOutput),
};
