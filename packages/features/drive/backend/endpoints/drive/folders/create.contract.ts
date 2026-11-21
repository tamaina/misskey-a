/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { jsonString } from '../../../../../api/backend/transport/string.schema.js';
import { misskeyId, uniqueStrings } from '../../../../../users/backend/users.input.schema.js';
import { packedDriveFolderSchema } from '../../../../../notes/backend/drive.schema.js';

export const driveFoldersCreateErrors = {
		noSuchFolder: {
			message: 'No such folder.',
			code: 'NO_SUCH_FOLDER',
			id: '53326628-a00d-40a6-a3cd-8975105c0f95',
		},
	} as const;
export const driveFoldersCreateContract = oc.$meta({
	requestName: 'drive/folders/create',
	'requireCredential': true,
	'kind': 'write:drive',
	'limit': { 'duration': 3600000, 'max': 10 },
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/drive/folders/create', tags: ['drive'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_FOLDER: { status: 400, data: apiErrorData } }).input(objectInput({
		"name": v.optional(jsonString({ "maxLength": 200 }), "Untitled"),
		"parentId": v.exactOptional(v.nullable(misskeyId)),
	})).output(packedDriveFolderSchema);
