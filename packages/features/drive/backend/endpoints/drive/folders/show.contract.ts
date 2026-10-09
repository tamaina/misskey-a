/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';

import { misskeyId } from '../../../../../users/backend/users.input.schema.js';
import { packedDriveFolderSchema } from '../../../../../notes/backend/drive.schema.js';

export const driveFoldersShowInput = objectInput({
	"folderId": misskeyId,
});
export const driveFoldersShowErrors = {
		noSuchFolder: {
			message: 'No such folder.',
			code: 'NO_SUCH_FOLDER',
			id: 'd74ab9eb-bb09-4bba-bf24-fb58f761e1e9',
		},
	} as const;
export const driveFoldersShowContract = oc.$meta<{ requestName: 'drive/folders/show' }>({ requestName: 'drive/folders/show' })
	.route({ method: 'POST', path: '/drive/folders/show', operationId: 'post___drive___folders___show', tags: ['drive'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_FOLDER: { status: 400, data: apiErrorData } }).input(driveFoldersShowInput).output(packedDriveFolderSchema);
