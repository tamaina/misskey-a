/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesReactionsCreateInput = objectInput({ noteId: misskeyId, reaction: v.string() });
export const notesReactionsCreateOutput = v.void();
export const notesReactionsCreateErrors = {
	noSuchNote: {
		message: 'No such note.',
		code: 'NO_SUCH_NOTE',
		id: '033d0620-5bfe-4027-965d-980b0c85a3ea',
	},
	alreadyReacted: {
		message: 'You are already reacting to that note.',
		code: 'ALREADY_REACTED',
		id: '71efcf98-86d6-4e2b-b2ad-9d032369366b',
	},
	youHaveBeenBlocked: {
		message: 'You cannot react this note because you have been blocked by this user.',
		code: 'YOU_HAVE_BEEN_BLOCKED',
		id: '20ef5475-9f38-4e4c-bd33-de6d979498ec',
	},
	cannotReactToRenote: {
		message: 'You cannot react to Renote.',
		code: 'CANNOT_REACT_TO_RENOTE',
		id: 'eaccdc08-ddef-43fe-908f-d108faad57f5',
	},
} as const;
export const notesReactionsCreatePolicy = { name: 'notes/reactions/create', requireCredential: true, prohibitMoved: true, kind: 'write:reactions' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const notesReactionsCreateContract = oc.$meta<{ requestName: 'notes/reactions/create' }>({ requestName: 'notes/reactions/create' })
	.route({ method: 'POST', path: '/notes/reactions/create', operationId: 'post___notes___reactions___create', tags: ['reactions', 'notes'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData }, ALREADY_REACTED: { status: 400, data: apiErrorData }, YOU_HAVE_BEEN_BLOCKED: { status: 400, data: apiErrorData }, CANNOT_REACT_TO_RENOTE: { status: 400, data: apiErrorData } })
	.input(notesReactionsCreateInput).output(notesReactionsCreateOutput);
