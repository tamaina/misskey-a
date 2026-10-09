/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../users.input.schema.js';

export const usersUpdateMemoErrors = {
	noSuchUser: {
		message: 'No such user.',
		code: 'NO_SUCH_USER',
		id: '6fef56f3-e765-4957-88e5-c6f65329b8a5',
	},
} as const;
export const usersUpdateMemoContract = oc.$meta({ requestName: 'users/update-memo' } as const)
	.route({ method: 'POST', path: '/users/update-memo', operationId: 'post___users___update-memo', tags: ['account'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_USER: { status: 400, data: apiErrorData } }).input(objectInput({
	'userId': misskeyId,
	'memo': v.pipe(v.nullable(v.string()), v.metadata({ 'description': 'A personal memo for the target user. If null or empty, delete the memo.' })),
})).output(v.void());
