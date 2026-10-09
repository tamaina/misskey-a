/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';

import { packedDriveFileSchema } from '../../../../../notes/backend/drive.schema.js';

export const driveFilesFindByHashErrors = {} as const;
export const driveFilesFindByHashContract = oc.$meta({ requestName: 'drive/files/find-by-hash' } as const)
	.route({ method: 'POST', path: '/drive/files/find-by-hash', operationId: 'post___drive___files___find-by-hash', tags: ['drive'], description: 'Search for a drive file by a hash of the contents.', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(objectInput({
		"md5": v.string(),
	})).output(v.array(packedDriveFileSchema));
