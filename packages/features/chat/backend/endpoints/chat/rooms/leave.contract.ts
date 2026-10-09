/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../../request.schema.js';

export const chatRoomsLeaveInput = objectInput({ roomId: misskeyId });
export const chatRoomsLeaveOutput = v.void();
export const chatRoomsLeaveErrors = {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: 'cb7f3179-50e8-4389-8c30-dbe2650a67c9',
		},
	} as const;
export const chatRoomsLeavePolicy = { name: 'chat/rooms/leave', requireCredential: true, kind: 'write:chat' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatRoomsLeaveContract = oc.$meta<{ requestName: 'chat/rooms/leave' }>({ requestName: 'chat/rooms/leave' })
	.route({ method: 'POST', path: '/chat/rooms/leave', operationId: 'post___chat___rooms___leave', tags: ['chat'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_ROOM: { status: 400, data: apiErrorData } })
	.input(chatRoomsLeaveInput).output(chatRoomsLeaveOutput);
