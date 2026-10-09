/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../../../request.schema.js';

export const chatRoomsInvitationsIgnoreInput = objectInput({ roomId: misskeyId });
export const chatRoomsInvitationsIgnoreOutput = v.void();
export const chatRoomsInvitationsIgnoreErrors = {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: '5130557e-5a11-4cfb-9cc5-fe60cda5de0d',
		},
	} as const;
export const chatRoomsInvitationsIgnorePolicy = { name: 'chat/rooms/invitations/ignore', requireCredential: true, kind: 'write:chat' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatRoomsInvitationsIgnoreContract = oc.$meta<{ requestName: 'chat/rooms/invitations/ignore' }>({ requestName: 'chat/rooms/invitations/ignore' })
	.route({ method: 'POST', path: '/chat/rooms/invitations/ignore', operationId: 'post___chat___rooms___invitations___ignore', tags: ['chat'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_ROOM: { status: 400, data: apiErrorData } })
	.input(chatRoomsInvitationsIgnoreInput).output(chatRoomsInvitationsIgnoreOutput);
