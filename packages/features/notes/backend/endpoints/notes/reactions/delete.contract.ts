/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesReactionsDeleteErrors = {
	noSuchNote: {
		message: 'No such note.',
		code: 'NO_SUCH_NOTE',
		id: '764d9fce-f9f2-4a0e-92b1-6ceac9a7ad37',
	},
	notReacted: {
		message: 'You are not reacting to that note.',
		code: 'NOT_REACTED',
		id: '92f4426d-4196-4125-aa5b-02943e2ec8fc',
	},
} as const;
export const notesReactionsDeletePolicy = { name: 'notes/reactions/delete', requireCredential: true, kind: 'write:reactions', limit: { duration: 3600000, max: 60, minInterval: 3000 } } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const notesReactionsDeleteContract = oc.$meta({ requestName: 'notes/reactions/delete' } as const)
	.route({ method: 'POST', path: '/notes/reactions/delete', operationId: 'post___notes___reactions___delete', tags: ['reactions', 'notes'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData }, NOT_REACTED: { status: 400, data: apiErrorData } })
	.input(objectInput({ noteId: misskeyId })).output(v.void());
