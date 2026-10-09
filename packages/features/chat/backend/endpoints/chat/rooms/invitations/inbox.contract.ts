/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../../api/backend/transport/errors.schema.js';
import { packedChatRoomInvitationSchema } from '../../../../chat.schema.js';
import { objectInput, misskeyId } from '../../../../request.schema.js';

export const chatRoomsInvitationsInboxInput = objectInput({
	"limit": v.optional(v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
});
export const chatRoomsInvitationsInboxOutput = v.array(packedChatRoomInvitationSchema);
export const chatRoomsInvitationsInboxErrors = {
	} as const;
export const chatRoomsInvitationsInboxPolicy = { name: 'chat/rooms/invitations/inbox', requireCredential: true, kind: 'read:chat' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatRoomsInvitationsInboxContract = oc.$meta<{ requestName: 'chat/rooms/invitations/inbox' }>({ requestName: 'chat/rooms/invitations/inbox' })
	.route({ method: 'POST', path: '/chat/rooms/invitations/inbox', operationId: 'post___chat___rooms___invitations___inbox', tags: ['chat'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(chatRoomsInvitationsInboxInput).output(chatRoomsInvitationsInboxOutput);
