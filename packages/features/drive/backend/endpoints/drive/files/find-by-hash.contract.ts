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

import { packedDriveFileSchema } from '../../../../../notes/backend/drive.schema.js';

export const driveFilesFindByHashErrors = {} as const;
export const driveFilesFindByHashContract = oc.$meta({
	requestName: 'drive/files/find-by-hash',
	'requireCredential': true,
	'kind': 'read:drive',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/drive/files/find-by-hash', tags: ['drive'], description: 'Search for a drive file by a hash of the contents.', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(objectInput({
		"md5": v.string(),
	})).output(v.array(packedDriveFileSchema));
