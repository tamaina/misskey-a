/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { packedChatRoomSchema } from '../../../chat.schema.js';
import { objectInput, jsonString } from '../../../request.schema.js';

export const chatRoomsCreateErrors = {
	} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatRoomsCreateContract = oc.$meta({
	requestName: 'chat/rooms/create',
	requireCredential: true,
	prohibitMoved: true,
	kind: 'write:chat',
	limit: {
		duration: 86400000,
		max: 10,
	},
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/chat/rooms/create', tags: ['chat'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(objectInput({
	"name": jsonString({ "maxLength": 256 }),
	"description": v.exactOptional(jsonString({ "maxLength": 1024 })),
})).output(packedChatRoomSchema);
