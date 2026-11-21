/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { packedChatRoomSchema } from '../../../chat.schema.js';
import { objectInput, misskeyId } from '../../../request.schema.js';

export const chatRoomsShowErrors = {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: '857ae02f-8759-4d20-9adb-6e95fffe4fd7',
		},
	} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatRoomsShowContract = oc.$meta({
	requestName: 'chat/rooms/show',
	requireCredential: true,
	kind: 'read:chat',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/chat/rooms/show', tags: ['chat'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, NO_SUCH_ROOM: { status: 400, data: apiErrorData } })
	.input(objectInput({
	"roomId": misskeyId,
})).output(packedChatRoomSchema);
