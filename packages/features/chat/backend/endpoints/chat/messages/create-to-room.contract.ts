/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { packedChatMessageLiteForRoomSchema } from '../../../chat.schema.js';
import { objectInput, misskeyId, jsonString } from '../../../request.schema.js';

export const chatMessagesCreateToRoomInput = objectInput({
	"text": v.exactOptional(v.nullable(jsonString({ "maxLength": 2000 }))),
	"fileId": v.exactOptional(misskeyId),
	"toRoomId": misskeyId,
});
export const chatMessagesCreateToRoomOutput = packedChatMessageLiteForRoomSchema;
export const chatMessagesCreateToRoomErrors = {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: '8098520d-2da5-4e8f-8ee1-df78b55a4ec6',
		},

		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'b6accbd3-1d7b-4d9f-bdb7-eb185bac06db',
		},

		contentRequired: {
			message: 'Content required. You need to set text or fileId.',
			code: 'CONTENT_REQUIRED',
			id: '340517b7-6d04-42c0-bac1-37ee804e3594',
		},
	} as const;
export const chatMessagesCreateToRoomPolicy = { name: 'chat/messages/create-to-room', requireCredential: true, prohibitMoved: true, kind: 'write:chat', limit: {
		duration: 3600000,
		max: 500,
	} } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatMessagesCreateToRoomContract = oc.$meta<{ requestName: 'chat/messages/create-to-room' }>({ requestName: 'chat/messages/create-to-room' })
	.route({ method: 'POST', path: '/chat/messages/create-to-room', operationId: 'post___chat___messages___create-to-room', tags: ['chat'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, NO_SUCH_ROOM: { status: 400, data: apiErrorData }, NO_SUCH_FILE: { status: 400, data: apiErrorData }, CONTENT_REQUIRED: { status: 400, data: apiErrorData } })
	.input(chatMessagesCreateToRoomInput).output(chatMessagesCreateToRoomOutput);
