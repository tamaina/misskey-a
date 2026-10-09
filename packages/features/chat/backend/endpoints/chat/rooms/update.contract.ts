/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { packedChatRoomSchema } from '../../../chat.schema.js';
import { objectInput, misskeyId, jsonString } from '../../../request.schema.js';

export const chatRoomsUpdateInput = objectInput({
	"roomId": misskeyId,
	"name": v.exactOptional(jsonString({ "maxLength": 256 })),
	"description": v.exactOptional(jsonString({ "maxLength": 1024 })),
});
export const chatRoomsUpdateOutput = packedChatRoomSchema;
export const chatRoomsUpdateErrors = {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: 'fcdb0f92-bda6-47f9-bd05-343e0e020932',
		},
	} as const;
export const chatRoomsUpdatePolicy = { name: 'chat/rooms/update', requireCredential: true, kind: 'write:chat' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatRoomsUpdateContract = oc.$meta<{ requestName: 'chat/rooms/update' }>({ requestName: 'chat/rooms/update' })
	.route({ method: 'POST', path: '/chat/rooms/update', operationId: 'post___chat___rooms___update', tags: ['chat'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, NO_SUCH_ROOM: { status: 400, data: apiErrorData } })
	.input(chatRoomsUpdateInput).output(chatRoomsUpdateOutput);
