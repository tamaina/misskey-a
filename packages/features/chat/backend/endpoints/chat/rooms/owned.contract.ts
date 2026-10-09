/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { packedChatRoomSchema } from '../../../chat.schema.js';
import { objectInput, misskeyId } from '../../../request.schema.js';

export const chatRoomsOwnedInput = objectInput({
	"limit": v.optional(v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
});
export const chatRoomsOwnedOutput = v.array(packedChatRoomSchema);
export const chatRoomsOwnedErrors = {
	} as const;
export const chatRoomsOwnedPolicy = { name: 'chat/rooms/owned', requireCredential: true, kind: 'read:chat' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatRoomsOwnedContract = oc.$meta<{ requestName: 'chat/rooms/owned' }>({ requestName: 'chat/rooms/owned' })
	.route({ method: 'POST', path: '/chat/rooms/owned', operationId: 'post___chat___rooms___owned', tags: ['chat'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(chatRoomsOwnedInput).output(chatRoomsOwnedOutput);
