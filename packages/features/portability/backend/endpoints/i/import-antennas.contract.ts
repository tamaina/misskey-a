/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { misskeyId } from '../../../../users/backend/users.input.schema.js';

export const iImportAntennasErrors = {
		noSuchFile: { message: 'No such file.', code: 'NO_SUCH_FILE', id: '3b71d086-c3fa-431c-b01d-ded65a777172' },
		noSuchUser: { message: 'No such user.', code: 'NO_SUCH_USER', id: 'e842c379-8ac7-4cf7-b07a-4d4de7e4671c' },
		emptyFile: { message: 'That file is empty.', code: 'EMPTY_FILE', id: '7f60115d-8d93-4b0f-bd0e-3815dcbb389f' },
		tooManyAntennas: { message: 'You cannot create antenna any more.', code: 'TOO_MANY_ANTENNAS', id: '600917d4-a4cb-4cc5-8ba8-7ac8ea3c7779' },
	} as const;
export const iImportAntennasContract = oc.$meta({ requestName: 'i/import-antennas' } as const)
	.route({ method: 'POST', path: '/i/import-antennas', operationId: 'post___i___import-antennas', successStatus: 204, spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_FILE: { status: 400, data: apiErrorData }, NO_SUCH_USER: { status: 400, data: apiErrorData }, EMPTY_FILE: { status: 400, data: apiErrorData }, TOO_MANY_ANTENNAS: { status: 400, data: apiErrorData } }).input(objectInput({ fileId: misskeyId })).output(v.void());

export type IImportAntennasInput = v.InferOutput<NonNullable<typeof iImportAntennasContract['~orpc']['inputSchema']>>;
