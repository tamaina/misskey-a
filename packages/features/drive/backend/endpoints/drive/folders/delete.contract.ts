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

import { misskeyId } from '../../../../../users/backend/users.input.schema.js';

export const driveFoldersDeleteErrors = {
		noSuchFolder: {
			message: 'No such folder.',
			code: 'NO_SUCH_FOLDER',
			id: '1069098f-c281-440f-b085-f9932edbe091',
		},

		hasChildFilesOrFolders: {
			message: 'This folder has child files or folders.',
			code: 'HAS_CHILD_FILES_OR_FOLDERS',
			id: 'b0fc8a17-963c-405d-bfbc-859a487295e1',
		},
	} as const;
export const driveFoldersDeleteContract = oc.$meta({
	requestName: 'drive/folders/delete',
	'requireCredential': true,
	'kind': 'write:drive',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/drive/folders/delete', tags: ['drive'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_FOLDER: { status: 400, data: apiErrorData }, HAS_CHILD_FILES_OR_FOLDERS: { status: 400, data: apiErrorData } }).input(objectInput({
		"folderId": misskeyId,
	})).output(v.void());
