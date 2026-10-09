/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';

import { misskeyId } from '../../../../../users/backend/users.input.schema.js';

export const driveFilesDeleteInput = objectInput({
	"fileId": misskeyId,
});
export const driveFilesDeleteErrors = {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: '908939ec-e52b-4458-b395-1025195cea58',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '5eb8d909-2540-4970-90b8-dd6f86088121',
		},
	} as const;
export const driveFilesDeleteContract = oc.$meta<{ requestName: 'drive/files/delete' }>({ requestName: 'drive/files/delete' })
	.route({ method: 'POST', path: '/drive/files/delete', operationId: 'post___drive___files___delete', tags: ['drive'], description: 'Delete an existing drive file.', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_FILE: { status: 400, data: apiErrorData }, ACCESS_DENIED: { status: 400, data: apiErrorData } }).input(driveFilesDeleteInput).output(v.void());
