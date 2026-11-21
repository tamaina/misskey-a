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

export const iImportFollowingErrors = {
		noSuchFile: { message: 'No such file.', code: 'NO_SUCH_FILE', id: 'b98644cf-a5ac-4277-a502-0b8054a709a3' },
		unexpectedFileType: { message: 'We need csv file.', code: 'UNEXPECTED_FILE_TYPE', id: '660f3599-bce0-4f95-9dde-311fd841c183' },
		tooBigFile: { message: 'That file is too big.', code: 'TOO_BIG_FILE', id: 'dee9d4ed-ad07-43ed-8b34-b2856398bc60' },
		emptyFile: { message: 'That file is empty.', code: 'EMPTY_FILE', id: '31a1b42c-06f7-42ae-8a38-a661c5c9f691' },
	} as const;
export const iImportFollowingContract = oc.$meta({
	requestName: 'i/import-following',
	requireCredential: true,
	secure: true,
	limit: {
		'duration': 3600000,
		'max': 1,
	},
	prohibitMoved: true,
	requiredRolePolicy: 'canImportFollowing',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/i/import-following', successStatus: 204, spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_FILE: { status: 400, data: apiErrorData }, UNEXPECTED_FILE_TYPE: { status: 400, data: apiErrorData }, TOO_BIG_FILE: { status: 400, data: apiErrorData }, EMPTY_FILE: { status: 400, data: apiErrorData } }).input(objectInput({ fileId: misskeyId, withReplies: v.optional(v.boolean()) })).output(v.void());

export type IImportFollowingInput = v.InferOutput<NonNullable<typeof iImportFollowingContract['~orpc']['inputSchema']>>;
