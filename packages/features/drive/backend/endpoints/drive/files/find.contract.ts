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

export const driveFilesFindErrors = {} as const;
export const driveFilesFindContract = oc.$meta({
	requestName: 'drive/files/find',
	'requireCredential': true,
	'kind': 'read:drive',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/drive/files/find', tags: ['drive'], description: 'Search for a drive file by the given parameters.', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(objectInput({
		"name": v.string(),
		"folderId": v.optional(v.nullable(misskeyId), null),
	})).output(v.array(packedDriveFileSchema));
