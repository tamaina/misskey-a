/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../../api/backend/transport/policy.types.js';

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../../api/backend/transport/errors.schema.js';
import { packedChatRoomInvitationSchema } from '../../../../chat.schema.js';
import { objectInput, misskeyId } from '../../../../request.schema.js';

export const chatRoomsInvitationsInboxErrors = {
	} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatRoomsInvitationsInboxContract = oc.$meta({
	requestName: 'chat/rooms/invitations/inbox',
	requireCredential: true,
	kind: 'read:chat',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/chat/rooms/invitations/inbox', tags: ['chat'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(objectInput({
	"limit": v.optional(v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
})).output(v.array(packedChatRoomInvitationSchema));
