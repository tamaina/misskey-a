/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { packedNoteReactionSchema } from '../../note-aux.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesReactionsErrors = {
	noSuchNote: {
		message: 'No such note.',
		code: 'NO_SUCH_NOTE',
		id: '263fff3d-d0e1-4af4-bea7-8408059b451a',
	},
} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];
export const notesReactionsContract = oc.$meta({
	requestName: 'notes/reactions',
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/notes/reactions', tags: ['notes', 'reactions'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData } })
	.input(objectInput({
	'noteId': misskeyId,
	'type': v.exactOptional(v.nullable(v.string())),
	'limit': v.optional(v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
})).output(v.array(packedNoteReactionSchema));
