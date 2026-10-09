/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { packedChatRoomSchema } from '../../../chat.schema.js';
import { objectInput, misskeyId } from '../../../request.schema.js';

export const chatRoomsShowInput = objectInput({
	"roomId": misskeyId,
});
export const chatRoomsShowOutput = packedChatRoomSchema;
export const chatRoomsShowErrors = {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: '857ae02f-8759-4d20-9adb-6e95fffe4fd7',
		},
	} as const;
export const chatRoomsShowPolicy = { name: 'chat/rooms/show', requireCredential: true, kind: 'read:chat' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatRoomsShowContract = oc.$meta<{ requestName: 'chat/rooms/show' }>({ requestName: 'chat/rooms/show' })
	.route({ method: 'POST', path: '/chat/rooms/show', operationId: 'post___chat___rooms___show', tags: ['chat'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, NO_SUCH_ROOM: { status: 400, data: apiErrorData } })
	.input(chatRoomsShowInput).output(chatRoomsShowOutput);
