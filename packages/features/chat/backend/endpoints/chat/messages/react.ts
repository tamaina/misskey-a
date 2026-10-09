/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { chatMessagesReactContract, chatMessagesReactPolicy } from './react.contract.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
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

	return implement(chatMessagesReactContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(chatMessagesReactPolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
