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

export const chatRoomsInvitationsCreateInput = objectInput({
	"roomId": misskeyId,
	"userId": misskeyId,
});
export const chatRoomsInvitationsCreateOutput = packedChatRoomInvitationSchema;
export const chatRoomsInvitationsCreateErrors = {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: '916f9507-49ba-4e90-b57f-1fd4deaa47a5',
		},
	} as const;
export const chatRoomsInvitationsCreatePolicy = { name: 'chat/rooms/invitations/create', requireCredential: true, prohibitMoved: true, kind: 'write:chat', limit: {
		duration: 86400000,
		max: 50,
	} } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatRoomsInvitationsCreateContract = oc.$meta<{ requestName: 'chat/rooms/invitations/create' }>({ requestName: 'chat/rooms/invitations/create' })
	.route({ method: 'POST', path: '/chat/rooms/invitations/create', operationId: 'post___chat___rooms___invitations___create', tags: ['chat'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, NO_SUCH_ROOM: { status: 400, data: apiErrorData } })
	.input(chatRoomsInvitationsCreateInput).output(chatRoomsInvitationsCreateOutput);
