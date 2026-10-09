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
import { packedDriveFolderSchema } from '../../../../../notes/backend/drive.schema.js';

export const driveFoldersUpdateErrors = {
		noSuchFolder: {
			message: 'No such folder.',
			code: 'NO_SUCH_FOLDER',
			id: 'f7974dac-2c0d-4a27-926e-23583b28e98e',
		},

		noSuchParentFolder: {
			message: 'No such parent folder.',
			code: 'NO_SUCH_PARENT_FOLDER',
			id: 'ce104e3a-faaf-49d5-b459-10ff0cbbcaa1',
		},

		recursiveNesting: {
			message: 'It can not be structured like nesting folders recursively.',
			code: 'RECURSIVE_NESTING',
			id: 'dbeb024837894013aed44279f9199740',
		},
	} as const;
export const driveFoldersUpdateContract = oc.$meta({ requestName: 'drive/folders/update' } as const)
	.route({ method: 'POST', path: '/drive/folders/update', operationId: 'post___drive___folders___update', tags: ['drive'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_FOLDER: { status: 400, data: apiErrorData }, NO_SUCH_PARENT_FOLDER: { status: 400, data: apiErrorData }, RECURSIVE_NESTING: { status: 400, data: apiErrorData } }).input(objectInput({
		"folderId": misskeyId,
		"name": v.exactOptional(jsonString({ "maxLength": 200 })),
		"parentId": v.exactOptional(v.nullable(misskeyId)),
	})).output(packedDriveFolderSchema);
