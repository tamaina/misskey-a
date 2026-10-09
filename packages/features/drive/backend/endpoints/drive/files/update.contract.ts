/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { jsonString } from '../../../../../api/backend/transport/string.schema.js';
import { misskeyId } from '../../../../../users/backend/users.input.schema.js';
import { packedDriveFileSchema } from '../../../../../notes/backend/drive.schema.js';

export const driveFilesUpdateInput = objectInput({
	"fileId": misskeyId,
	"folderId": v.exactOptional(v.nullable(misskeyId)),
	"name": v.exactOptional(v.string()),
	"isSensitive": v.exactOptional(v.boolean()),
	"comment": v.exactOptional(v.nullable(jsonString({ "maxLength": 512 }))),
});
export const driveFilesUpdateErrors = {
		invalidFileName: {
			message: 'Invalid file name.',
			code: 'INVALID_FILE_NAME',
			id: '395e7156-f9f0-475e-af89-53c3c23080c2',
		},

		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'e7778c7e-3af9-49cd-9690-6dbc3e6c972d',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '01a53b27-82fc-445b-a0c1-b558465a8ed2',
		},

		noSuchFolder: {
			message: 'No such folder.',
			code: 'NO_SUCH_FOLDER',
			id: 'ea8fb7a5-af77-4a08-b608-c0218176cd73',
		},

		restrictedByRole: {
			message: 'This feature is restricted by your role.',
			code: 'RESTRICTED_BY_ROLE',
			id: '7f59dccb-f465-75ab-5cf4-3ce44e3282f7',
		},
	} as const;
export const driveFilesUpdateContract = oc.$meta<{ requestName: 'drive/files/update' }>({ requestName: 'drive/files/update' })
	.route({ method: 'POST', path: '/drive/files/update', operationId: 'post___drive___files___update', tags: ['drive'], description: 'Update the properties of a drive file.', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, INVALID_FILE_NAME: { status: 400, data: apiErrorData }, NO_SUCH_FILE: { status: 400, data: apiErrorData }, ACCESS_DENIED: { status: 400, data: apiErrorData }, NO_SUCH_FOLDER: { status: 400, data: apiErrorData }, RESTRICTED_BY_ROLE: { status: 400, data: apiErrorData } }).input(driveFilesUpdateInput).output(packedDriveFileSchema);
