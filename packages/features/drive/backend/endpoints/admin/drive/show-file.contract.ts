/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';

import { packedJsonValueSchema } from '../../../../../users/backend/json-value.schema.js';
import { misskeyId } from '../../../../../users/backend/users.input.schema.js';
import { requestHeadersSchema, type DriveFileShowSelector } from '../../../management.schema.js';

export const adminDriveShowFileInput: v.GenericSchema<DriveFileShowSelector, DriveFileShowSelector> = v.union([
	objectInput({ fileId: misskeyId, url: v.exactOptional(packedJsonValueSchema) }),
	objectInput({ fileId: v.exactOptional(packedJsonValueSchema), url: v.string() }),
]);
export const adminDriveShowFileErrors = {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'caf3ca38-c6e5-472e-a30c-b05377dcc240',
		},
	} as const;
export const adminDriveShowFileContract = oc.$meta<{ requestName: 'admin/drive/show-file' }>({ requestName: 'admin/drive/show-file' })
	.route({ method: 'POST', path: '/admin/drive/show-file', operationId: 'post___admin___drive___show-file', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_FILE: { status: 400, data: apiErrorData } }).input(adminDriveShowFileInput).output(v.strictObject({
	id: v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	createdAt: v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	userId: v.pipe(v.nullable(v.string()), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	userHost: v.pipe(v.nullable(v.string()), v.metadata({ "description": "The local host is represented with `null`." })),
	md5: v.pipe(v.string(), v.metadata({ "format": "md5", "example": "15eca7fba0480996e2245f5185bf39f2" })),
	name: v.pipe(v.string(), v.metadata({ "example": "192.jpg" })),
	type: v.pipe(v.string(), v.metadata({ "example": "image/jpeg" })),
	size: v.pipe(v.pipe(v.number(), v.finite()), v.metadata({ "example": 51469 })),
	comment: v.nullable(v.string()),
	blurhash: v.nullable(v.string()),
	properties: v.strictObject({
		width: v.optional(v.pipe(v.number(), v.finite())),
		height: v.optional(v.pipe(v.number(), v.finite())),
		orientation: v.optional(v.pipe(v.number(), v.finite())),
		avgColor: v.optional(v.string()),
	}),
	storedInternal: v.pipe(v.nullable(v.boolean()), v.metadata({ "example": true })),
	url: v.pipe(v.nullable(v.string()), v.metadata({ "format": "url" })),
	thumbnailUrl: v.pipe(v.nullable(v.string()), v.metadata({ "format": "url" })),
	webpublicType: v.nullable(v.string()),
	webpublicUrl: v.pipe(v.nullable(v.string()), v.metadata({ "format": "url" })),
	accessKey: v.nullable(v.string()),
	thumbnailAccessKey: v.nullable(v.string()),
	webpublicAccessKey: v.nullable(v.string()),
	uri: v.nullable(v.string()),
	src: v.nullable(v.string()),
	folderId: v.pipe(v.nullable(v.string()), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	isSensitive: v.boolean(),
	isLink: v.boolean(),
	maybeSensitive: v.boolean(),
	maybePorn: v.boolean(),
	requestIp: v.nullable(v.string()),
	requestHeaders: v.nullable(requestHeadersSchema),
}));
