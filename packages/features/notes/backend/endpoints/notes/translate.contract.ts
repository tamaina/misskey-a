/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesTranslateInput = objectInput({
	'noteId': misskeyId,
	'targetLang': v.string(),
});
export const notesTranslateOutput = v.optional(v.strictObject({
	'sourceLang': v.string(),
	'text': v.string(),
}));
export const notesTranslateErrors = {
	unavailable: {
		message: 'Translate of notes unavailable.',
		code: 'UNAVAILABLE',
		id: '50a70314-2d8a-431b-b433-efa5cc56444c',
	},
	noSuchNote: {
		message: 'No such note.',
		code: 'NO_SUCH_NOTE',
		id: 'bea9b03f-36e0-49c5-a4db-627a029f8971',
	},
	cannotTranslateInvisibleNote: {
		message: 'Cannot translate invisible note.',
		code: 'CANNOT_TRANSLATE_INVISIBLE_NOTE',
		id: 'ea29f2ca-c368-43b3-aaf1-5ac3e74bbe5d',
	},
} as const;
export const notesTranslatePolicy = { name: 'notes/translate', requireCredential: true, kind: 'read:account' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const notesTranslateContract = oc.$meta<{ requestName: 'notes/translate' }>({ requestName: 'notes/translate' })
	.route({ method: 'POST', path: '/notes/translate', operationId: 'post___notes___translate', tags: ['notes'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, UNAVAILABLE: { status: 400, data: apiErrorData }, NO_SUCH_NOTE: { status: 400, data: apiErrorData }, CANNOT_TRANSLATE_INVISIBLE_NOTE: { status: 400, data: apiErrorData } })
	.input(notesTranslateInput).output(notesTranslateOutput);
