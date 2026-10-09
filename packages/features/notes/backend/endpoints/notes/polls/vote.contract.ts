/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesPollsVoteErrors = {
	noSuchNote: {
		message: 'No such note.',
		code: 'NO_SUCH_NOTE',
		id: 'ecafbd2e-c283-4d6d-aecb-1a0a33b75396',
	},

	noPoll: {
		message: 'The note does not attach a poll.',
		code: 'NO_POLL',
		id: '5f979967-52d9-4314-a911-1c673727f92f',
	},

	invalidChoice: {
		message: 'Choice ID is invalid.',
		code: 'INVALID_CHOICE',
		id: 'e0cc9a04-f2e8-41e4-a5f1-4127293260cc',
	},

	alreadyVoted: {
		message: 'You have already voted.',
		code: 'ALREADY_VOTED',
		id: '0963fc77-efac-419b-9424-b391608dc6d8',
	},

	alreadyExpired: {
		message: 'The poll is already expired.',
		code: 'ALREADY_EXPIRED',
		id: '1022a357-b085-4054-9083-8f8de358337e',
	},

	youHaveBeenBlocked: {
		message: 'You cannot vote this poll because you have been blocked by this user.',
		code: 'YOU_HAVE_BEEN_BLOCKED',
		id: '85a5377e-b1e9-4617-b0b9-5bea73331e49',
	},
} as const;
export const notesPollsVotePolicy = { name: 'notes/polls/vote', requireCredential: true, prohibitMoved: true, kind: 'write:votes' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const notesPollsVoteContract = oc.$meta({ requestName: 'notes/polls/vote' } as const)
	.route({ method: 'POST', path: '/notes/polls/vote', operationId: 'post___notes___polls___vote', tags: ['notes'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData }, NO_POLL: { status: 400, data: apiErrorData }, INVALID_CHOICE: { status: 400, data: apiErrorData }, ALREADY_VOTED: { status: 400, data: apiErrorData }, ALREADY_EXPIRED: { status: 400, data: apiErrorData }, YOU_HAVE_BEEN_BLOCKED: { status: 400, data: apiErrorData } })
	.input(objectInput({
	'noteId': misskeyId,
	'choice': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
})).output(v.void());
