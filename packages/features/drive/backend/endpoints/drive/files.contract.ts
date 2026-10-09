/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

import { misskeyId } from '../../../../users/backend/users.input.schema.js';
import { packedDriveFileSchema } from '../../../../notes/backend/drive.schema.js';

export const driveFilesInput = objectInput({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"folderId": v.optional(v.nullable(misskeyId), null),
	"type": v.exactOptional(v.nullable(v.pipe(v.string(), v.regex(new RegExp("^[a-zA-Z\\/\\-*]+$"))))),
	"sort": v.exactOptional(v.pipe(v.nullable(v.picklist(["+createdAt", "-createdAt", "+name", "-name", "+size", "-size"])), v.metadata({ "enum": ["+createdAt", "-createdAt", "+name", "-name", "+size", "-size", null] }))),
});
export const driveFilesErrors = {} as const;
export const driveFilesContract = oc.$meta<{ requestName: 'drive/files' }>({ requestName: 'drive/files' })
	.route({ method: 'POST', path: '/drive/files', operationId: 'post___drive___files', tags: ['drive'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(driveFilesInput).output(v.array(packedDriveFileSchema));
