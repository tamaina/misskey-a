/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { chatMessagesReactContract } from './react.contract.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import type { InferSchemaOutput } from '@orpc/contract';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { ChatMessageAccessError, type ChatService } from '@features/chat/backend/services/ChatService.js';
import { chatMessagesReactErrors } from './react.contract.js';
export interface ChatMessagesReactDependencies {
	chatService: Pick<ChatService, 'checkChatAvailability' | 'react'>;
}
export function createChatMessagesReactProcedure(deps: ChatMessagesReactDependencies) {
	async function execute(input: InferSchemaOutput<NonNullable<typeof chatMessagesReactContract['~orpc']['inputSchema']>>, actor: MiLocalUser): Promise<void> {
		await deps.chatService.checkChatAvailability(actor.id, 'write');
		try {
			await deps.chatService.react(input.messageId, actor.id, input.reaction);
		} catch (error) {
			if (error instanceof ChatMessageAccessError) {
				throw apiError(chatMessagesReactErrors.noSuchMessage);
			}
			throw error;
		}
	}

	return createApiProcedure<MiLocalUser>()(chatMessagesReactContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
