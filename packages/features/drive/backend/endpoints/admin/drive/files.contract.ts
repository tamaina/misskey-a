/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';

import { misskeyId } from '../../../../../users/backend/users.input.schema.js';
import { packedDriveFileSchema } from '../../../../../notes/backend/drive.schema.js';

export const adminDriveFilesErrors = {} as const;
export const adminDriveFilesContract = oc.$meta({
	requestName: 'admin/drive/files',
	'requireCredential': true,
	'requireModerator': true,
	'kind': 'read:admin:drive',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/admin/drive/files', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(objectInput({
		"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
		"sinceId": v.exactOptional(misskeyId),
		"untilId": v.exactOptional(misskeyId),
		"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
		"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
		"userId": v.exactOptional(v.nullable(misskeyId)),
		"type": v.exactOptional(v.nullable(v.pipe(v.string(), v.regex(new RegExp("^[a-zA-Z0-9\\/\\-*]+$"))))),
		"origin": v.optional(v.picklist(["combined", "local", "remote"]), "local"),
		"hostname": v.optional(v.pipe(v.nullable(v.string()), v.metadata({ "description": "The local host is represented with `null`." })), null),
	})).output(v.array(packedDriveFileSchema));
