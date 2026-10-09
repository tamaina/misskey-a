/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { misskeyId } from '../../../../users/backend/users.input.schema.js';

export const iImportBlockingInput = objectInput({ fileId: misskeyId });
export const iImportBlockingErrors = {
		noSuchFile: { message: 'No such file.', code: 'NO_SUCH_FILE', id: 'ebb53e5f-6574-9c0c-0b92-7ca6def56d7e' },
		unexpectedFileType: { message: 'We need csv file.', code: 'UNEXPECTED_FILE_TYPE', id: 'b6fab7d6-d945-d67c-dfdb-32da1cd12cfe' },
		tooBigFile: { message: 'That file is too big.', code: 'TOO_BIG_FILE', id: 'b7fbf0b1-aeef-3b21-29ef-fadd4cb72ccf' },
		emptyFile: { message: 'That file is empty.', code: 'EMPTY_FILE', id: '6f3a4dcc-f060-a707-4950-806fbdbe60d6' },
	} as const;
export const iImportBlockingContract = oc.$meta<{ requestName: 'i/import-blocking' }>({ requestName: 'i/import-blocking' })
	.route({ method: 'POST', path: '/i/import-blocking', operationId: 'post___i___import-blocking', successStatus: 204, spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_FILE: { status: 400, data: apiErrorData }, UNEXPECTED_FILE_TYPE: { status: 400, data: apiErrorData }, TOO_BIG_FILE: { status: 400, data: apiErrorData }, EMPTY_FILE: { status: 400, data: apiErrorData } }).input(iImportBlockingInput).output(v.void());
