/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { packedNoteSchema } from '../../note.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesRenotesErrors = {
	noSuchNote: {
		message: 'No such note.',
		code: 'NO_SUCH_NOTE',
		id: '12908022-2e21-46cd-ba6a-3edaf6093f46',
	},
} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];
export const notesRenotesContract = oc.$meta({
	requestName: 'notes/renotes',
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/notes/renotes', tags: ['notes'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData } })
	.input(objectInput({
	'noteId': misskeyId,
	'limit': v.optional(v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
})).output(v.array(packedNoteSchema));
