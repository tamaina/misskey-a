/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../../request.schema.js';

export const chatRoomsMuteErrors = {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: 'c2cde4eb-8d0f-42f1-8f2f-c4d6bfc8e5df',
		},
	} as const;
export const chatRoomsMutePolicy = { name: 'chat/rooms/mute', requireCredential: true, kind: 'write:chat' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatRoomsMuteContract = oc.$meta({ requestName: 'chat/rooms/mute' } as const)
	.route({ method: 'POST', path: '/chat/rooms/mute', operationId: 'post___chat___rooms___mute', tags: ['chat'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_ROOM: { status: 400, data: apiErrorData } })
	.input(objectInput({ roomId: misskeyId, mute: v.boolean() })).output(v.void());
