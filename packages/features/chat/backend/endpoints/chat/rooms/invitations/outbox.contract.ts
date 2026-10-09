/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../../api/backend/transport/errors.schema.js';
import { packedChatRoomInvitationSchema } from '../../../../chat.schema.js';
import { objectInput, misskeyId } from '../../../../request.schema.js';

export const chatRoomsInvitationsOutboxInput = objectInput({
	"roomId": misskeyId,
	"limit": v.optional(v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
});
export const chatRoomsInvitationsOutboxOutput = v.array(packedChatRoomInvitationSchema);
export const chatRoomsInvitationsOutboxErrors = {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: 'a3c6b309-9717-4316-ae94-a69b53437237',
		},
	} as const;
export const chatRoomsInvitationsOutboxPolicy = { name: 'chat/rooms/invitations/outbox', requireCredential: true, kind: 'read:chat' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatRoomsInvitationsOutboxContract = oc.$meta<{ requestName: 'chat/rooms/invitations/outbox' }>({ requestName: 'chat/rooms/invitations/outbox' })
	.route({ method: 'POST', path: '/chat/rooms/invitations/outbox', operationId: 'post___chat___rooms___invitations___outbox', tags: ['chat'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, NO_SUCH_ROOM: { status: 400, data: apiErrorData } })
	.input(chatRoomsInvitationsOutboxInput).output(chatRoomsInvitationsOutboxOutput);
