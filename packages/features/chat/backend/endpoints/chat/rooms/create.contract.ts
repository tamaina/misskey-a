/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { packedChatRoomSchema } from '../../../chat.schema.js';
import { objectInput, jsonString } from '../../../request.schema.js';

export const chatRoomsCreateInput = objectInput({
	"name": jsonString({ "maxLength": 256 }),
	"description": v.exactOptional(jsonString({ "maxLength": 1024 })),
});
export const chatRoomsCreateOutput = packedChatRoomSchema;
export const chatRoomsCreateErrors = {
	} as const;
export const chatRoomsCreatePolicy = { name: 'chat/rooms/create', requireCredential: true, prohibitMoved: true, kind: 'write:chat', limit: {
		duration: 86400000,
		max: 10,
	} } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatRoomsCreateContract = oc.$meta<{ requestName: 'chat/rooms/create' }>({ requestName: 'chat/rooms/create' })
	.route({ method: 'POST', path: '/chat/rooms/create', operationId: 'post___chat___rooms___create', tags: ['chat'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(chatRoomsCreateInput).output(chatRoomsCreateOutput);
