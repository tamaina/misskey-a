/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';

import { misskeyId } from '../../../../../users/backend/users.input.schema.js';
import { packedDriveFileSchema } from '../../../../../notes/backend/drive.schema.js';

export const driveFilesFindInput = objectInput({
	"name": v.string(),
	"folderId": v.optional(v.nullable(misskeyId), null),
});
export const driveFilesFindErrors = {} as const;
export const driveFilesFindContract = oc.$meta<{ requestName: 'drive/files/find' }>({ requestName: 'drive/files/find' })
	.route({ method: 'POST', path: '/drive/files/find', operationId: 'post___drive___files___find', tags: ['drive'], description: 'Search for a drive file by the given parameters.', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(driveFilesFindInput).output(v.array(packedDriveFileSchema));
