/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { packedNoteReactionWithNoteSchema } from '../../note-aux.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const usersReactionsErrors = {
	reactionsNotPublic: {
		message: 'Reactions of the user is not public.',
		code: 'REACTIONS_NOT_PUBLIC',
		id: '673a7dd2-6924-1093-e0c0-e68456ceae5c',
	},
	isRemoteUser: {
		message: 'Currently unavailable to display reactions of remote users. See https://github.com/misskey-dev/misskey/issues/12964',
		code: 'IS_REMOTE_USER',
		id: '6b95fa98-8cf9-2350-e284-f0ffdb54a805',
	},
} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];
export const usersReactionsContract = oc.$meta({
	requestName: 'users/reactions',
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/users/reactions', tags: ['users', 'reactions'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, REACTIONS_NOT_PUBLIC: { status: 400, data: apiErrorData }, IS_REMOTE_USER: { status: 400, data: apiErrorData } })
	.input(objectInput({
	'userId': misskeyId,
	'limit': v.optional(v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
})).output(v.array(packedNoteReactionWithNoteSchema));
