/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../../request.schema.js';

export const chatRoomsDeleteInput = objectInput({ roomId: misskeyId });
export const chatRoomsDeleteOutput = v.void();
export const chatRoomsDeleteErrors = {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: 'd4e3753d-97bf-4a19-ab8e-21080fbc0f4b',
		},
	} as const;
export const chatRoomsDeletePolicy = { name: 'chat/rooms/delete', requireCredential: true, kind: 'write:chat' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatRoomsDeleteContract = oc.$meta<{ requestName: 'chat/rooms/delete' }>({ requestName: 'chat/rooms/delete' })
	.route({ method: 'POST', path: '/chat/rooms/delete', operationId: 'post___chat___rooms___delete', tags: ['chat'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_ROOM: { status: 400, data: apiErrorData } })
	.input(chatRoomsDeleteInput).output(chatRoomsDeleteOutput);
