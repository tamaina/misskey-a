/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc, type Meta } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { misskeyId } from '../../../../users/backend/users.input.schema.js';

export const iImportUserListsErrors = {
		noSuchFile: { message: 'No such file.', code: 'NO_SUCH_FILE', id: 'ea9cc34f-c415-4bc6-a6fe-28ac40357049' },
		unexpectedFileType: { message: 'We need csv file.', code: 'UNEXPECTED_FILE_TYPE', id: 'a3c9edda-dd9b-4596-be6a-150ef813745c' },
		tooBigFile: { message: 'That file is too big.', code: 'TOO_BIG_FILE', id: 'ae6e7a22-971b-4b52-b2be-fc0b9b121fe9' },
		emptyFile: { message: 'That file is empty.', code: 'EMPTY_FILE', id: '99efe367-ce6e-4d44-93f8-5fae7b040356' },
	} as const;
export const iImportUserListsContract = oc.$meta({
	requestName: 'i/import-user-lists',
	requireCredential: true,
	secure: true,
	limit: {
		'duration': 3600000,
		'max': 1,
	},
	prohibitMoved: true,
	requiredRolePolicy: 'canImportUserLists',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/i/import-user-lists', successStatus: 204, spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_FILE: { status: 400, data: apiErrorData }, UNEXPECTED_FILE_TYPE: { status: 400, data: apiErrorData }, TOO_BIG_FILE: { status: 400, data: apiErrorData }, EMPTY_FILE: { status: 400, data: apiErrorData } }).input(objectInput({ fileId: misskeyId })).output(v.void());

export type IImportUserListsInput = v.InferOutput<NonNullable<typeof iImportUserListsContract['~orpc']['inputSchema']>>;
