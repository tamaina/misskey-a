/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { misskeyId } from '../../../../users/backend/users.input.schema.js';

export const iImportMutingErrors = {
		noSuchFile: { message: 'No such file.', code: 'NO_SUCH_FILE', id: 'e674141e-bd2a-ba85-e616-aefb187c9c2a' },
		unexpectedFileType: { message: 'We need csv file.', code: 'UNEXPECTED_FILE_TYPE', id: '568c6e42-c86c-ba09-c004-517f83f9f1a8' },
		tooBigFile: { message: 'That file is too big.', code: 'TOO_BIG_FILE', id: '9b4ada6d-d7f7-0472-0713-4f558bd1ec9c' },
		emptyFile: { message: 'That file is empty.', code: 'EMPTY_FILE', id: 'd2f12af1-e7b4-feac-86a3-519548f2728e' },
	} as const;
export const iImportMutingContract = oc.$meta({ requestName: 'i/import-muting' } as const)
	.route({ method: 'POST', path: '/i/import-muting', operationId: 'post___i___import-muting', successStatus: 204, spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_FILE: { status: 400, data: apiErrorData }, UNEXPECTED_FILE_TYPE: { status: 400, data: apiErrorData }, TOO_BIG_FILE: { status: 400, data: apiErrorData }, EMPTY_FILE: { status: 400, data: apiErrorData } }).input(objectInput({ fileId: misskeyId })).output(v.void());

export type IImportMutingInput = v.InferOutput<NonNullable<typeof iImportMutingContract['~orpc']['inputSchema']>>;
