/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { packedChatMessageSchema } from '../../chat.schema.js';
import { objectInput } from '../../request.schema.js';

export const chatHistoryErrors = {
	} as const;
export const chatHistoryPolicy = { name: 'chat/history', requireCredential: true, kind: 'read:chat' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatHistoryContract = oc.$meta({ requestName: 'chat/history' } as const)
	.route({ method: 'POST', path: '/chat/history', operationId: 'post___chat___history', tags: ['chat'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(objectInput({
	"limit": v.optional(v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"room": v.optional(v.boolean(), false),
})).output(v.array(packedChatMessageSchema));
