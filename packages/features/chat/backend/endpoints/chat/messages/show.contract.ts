/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { packedChatMessageSchema } from '../../../chat.schema.js';
import { objectInput, misskeyId } from '../../../request.schema.js';

export const chatMessagesShowInput = objectInput({
	"messageId": misskeyId,
});
export const chatMessagesShowOutput = packedChatMessageSchema;
export const chatMessagesShowErrors = {
		noSuchMessage: {
			message: 'No such message.',
			code: 'NO_SUCH_MESSAGE',
			id: '3710865b-1848-4da9-8d61-cfed15510b93',
		},
	} as const;
export const chatMessagesShowPolicy = { name: 'chat/messages/show', requireCredential: true, kind: 'read:chat' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const chatMessagesShowContract = oc.$meta<{ requestName: 'chat/messages/show' }>({ requestName: 'chat/messages/show' })
	.route({ method: 'POST', path: '/chat/messages/show', operationId: 'post___chat___messages___show', tags: ['chat'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors, NO_SUCH_MESSAGE: { status: 400, data: apiErrorData } })
	.input(chatMessagesShowInput).output(chatMessagesShowOutput);
