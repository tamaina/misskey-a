/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { packedChatMessageSchema } from '../../../chat.schema.js';
import { objectInput, misskeyId } from '../../../request.schema.js';

export const chatMessagesShowErrors = {
		noSuchMessage: {
			message: 'No such message.',
			code: 'NO_SUCH_MESSAGE',
			id: '3710865b-1848-4da9-8d61-cfed15510b93',
		},
	} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatMessagesShowContract = oc.$meta({
	requestName: 'chat/messages/show',
	requireCredential: true,
	kind: 'read:chat',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/chat/messages/show', tags: ['chat'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, NO_SUCH_MESSAGE: { status: 400, data: apiErrorData } })
	.input(objectInput({
	"messageId": misskeyId,
})).output(packedChatMessageSchema);
