/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';

import { driveFileShowSelectorSchema } from '../../../management.schema.js';
import { packedDriveFileSchema } from '../../../../../notes/backend/drive.schema.js';

export const driveFilesShowErrors = {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: '067bc436-2718-4795-b0fb-ecbe43949e31',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '25b73c73-68b1-41d0-bad1-381cfdf6579f',
		},
	} as const;
export const driveFilesShowContract = oc.$meta({ requestName: 'drive/files/show' } as const)
	.route({ method: 'POST', path: '/drive/files/show', operationId: 'post___drive___files___show', tags: ['drive'], description: 'Show the properties of a drive file.', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_FILE: { status: 400, data: apiErrorData }, ACCESS_DENIED: { status: 400, data: apiErrorData } }).input(driveFileShowSelectorSchema).output(packedDriveFileSchema);
