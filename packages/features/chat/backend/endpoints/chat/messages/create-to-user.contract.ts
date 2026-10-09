/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { packedChatMessageLiteFor1on1Schema } from '../../../chat.schema.js';
import { objectInput, misskeyId, jsonString } from '../../../request.schema.js';

export const chatMessagesCreateToUserErrors = {
		recipientIsYourself: {
			message: 'You can not send a message to yourself.',
			code: 'RECIPIENT_IS_YOURSELF',
			id: '17e2ba79-e22a-4cbc-bf91-d327643f4a7e',
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '11795c64-40ea-4198-b06e-3c873ed9039d',
		},

		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: '4372b8e2-185d-4146-8749-2f68864a3e5f',
		},

		contentRequired: {
			message: 'Content required. You need to set text or fileId.',
			code: 'CONTENT_REQUIRED',
			id: '25587321-b0e6-449c-9239-f8925092942c',
		},

		youHaveBeenBlocked: {
			message: 'You cannot send a message because you have been blocked by this user.',
			code: 'YOU_HAVE_BEEN_BLOCKED',
			id: 'c15a5199-7422-4968-941a-2a462c478f7d',
		},
	} as const;
export const chatMessagesCreateToUserPolicy = { name: 'chat/messages/create-to-user', requireCredential: true, prohibitMoved: true, kind: 'write:chat', limit: {
		duration: 3600000,
		max: 500,
	} } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatMessagesCreateToUserContract = oc.$meta({ requestName: 'chat/messages/create-to-user' } as const)
	.route({ method: 'POST', path: '/chat/messages/create-to-user', operationId: 'post___chat___messages___create-to-user', tags: ['chat'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, RECIPIENT_IS_YOURSELF: { status: 400, data: apiErrorData }, NO_SUCH_USER: { status: 400, data: apiErrorData }, NO_SUCH_FILE: { status: 400, data: apiErrorData }, CONTENT_REQUIRED: { status: 400, data: apiErrorData }, YOU_HAVE_BEEN_BLOCKED: { status: 400, data: apiErrorData } })
	.input(objectInput({
	"text": v.exactOptional(v.nullable(jsonString({ "maxLength": 2000 }))),
	"fileId": v.exactOptional(misskeyId),
	"toUserId": misskeyId,
})).output(packedChatMessageLiteFor1on1Schema);
