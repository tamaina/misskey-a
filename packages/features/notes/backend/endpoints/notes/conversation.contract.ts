/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { packedNoteSchema } from '../../note.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesConversationInput = objectInput({
	'noteId': misskeyId,
	'limit': v.optional(v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'offset': v.optional(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), 0),
});
export const notesConversationOutput = v.array(packedNoteSchema);
export const notesConversationErrors = {
	noSuchNote: {
		message: 'No such note.',
		code: 'NO_SUCH_NOTE',
		id: 'e1035875-9551-45ec-afa8-1ded1fcb53c8',
	},
} as const;
export const notesConversationPolicy = { name: 'notes/conversation', requireCredential: false } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];
export const notesConversationContract = oc.$meta<{ requestName: 'notes/conversation' }>({ requestName: 'notes/conversation' })
	.route({ method: 'POST', path: '/notes/conversation', operationId: 'post___notes___conversation', tags: ['notes'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData } })
	.input(notesConversationInput).output(notesConversationOutput);
