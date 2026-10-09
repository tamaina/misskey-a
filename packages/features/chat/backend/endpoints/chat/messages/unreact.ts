/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { chatMessagesUnreactContract, chatMessagesUnreactPolicy } from './unreact.contract.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { InferSchemaOutput } from '@orpc/contract';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { ChatMessageAccessError, type ChatService } from '@features/chat/backend/services/ChatService.js';
import { chatMessagesUnreactErrors } from './unreact.contract.js';
export interface ChatMessagesUnreactDependencies {
	chatService: Pick<ChatService, 'checkChatAvailability' | 'unreact'>;
}
export function createChatMessagesUnreactProcedure(deps: ChatMessagesUnreactDependencies) {
	async function execute(input: InferSchemaOutput<NonNullable<typeof chatMessagesUnreactContract['~orpc']['inputSchema']>>, actor: MiLocalUser): Promise<void> {
		await deps.chatService.checkChatAvailability(actor.id, 'write');
		try {
			await deps.chatService.unreact(input.messageId, actor.id, input.reaction);
		} catch (error) {
			if (error instanceof ChatMessageAccessError) {
				throw apiError(chatMessagesUnreactErrors.noSuchMessage);
			}
			throw error;
		}
	}

	return implement(chatMessagesUnreactContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(chatMessagesUnreactPolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
