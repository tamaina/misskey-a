/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { packedChatMessageSchema } from '../../../chat.schema.js';
import { objectInput, misskeyId, jsonString } from '../../../request.schema.js';

export const chatMessagesSearchInput = objectInput({
	"query": jsonString({ "minLength": 1, "maxLength": 256 }),
	"limit": v.optional(v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"userId": v.exactOptional(v.nullable(misskeyId)),
	"roomId": v.exactOptional(v.nullable(misskeyId)),
});
export const chatMessagesSearchOutput = v.array(packedChatMessageSchema);
export const chatMessagesSearchErrors = {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: '460b3669-81b0-4dc9-a997-44442141bf83',
		},
	} as const;
export const chatMessagesSearchPolicy = { name: 'chat/messages/search', requireCredential: true, kind: 'read:chat' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatMessagesSearchContract = oc.$meta<{ requestName: 'chat/messages/search' }>({ requestName: 'chat/messages/search' })
	.route({ method: 'POST', path: '/chat/messages/search', operationId: 'post___chat___messages___search', tags: ['chat'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, NO_SUCH_ROOM: { status: 400, data: apiErrorData } })
	.input(chatMessagesSearchInput).output(chatMessagesSearchOutput);
