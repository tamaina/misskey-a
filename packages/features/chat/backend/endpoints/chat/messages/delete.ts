/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { chatMessagesDeleteContract } from './delete.contract.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import type { InferSchemaOutput } from '@orpc/contract';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { type ChatService } from '@features/chat/backend/services/ChatService.js';
import { chatMessagesDeleteErrors } from './delete.contract.js';
export interface ChatMessagesDeleteDependencies {
	chatService: Pick<ChatService, 'checkChatAvailability' | 'findMyMessageById' | 'deleteMessage'>;
}
export function createChatMessagesDeleteProcedure(deps: ChatMessagesDeleteDependencies) {
	async function execute(input: InferSchemaOutput<NonNullable<typeof chatMessagesDeleteContract['~orpc']['inputSchema']>>, actor: MiLocalUser): Promise<void> {
		await deps.chatService.checkChatAvailability(actor.id, 'write');
		const message = await deps.chatService.findMyMessageById(actor.id, input.messageId);
		if (message == null) throw apiError(chatMessagesDeleteErrors.noSuchMessage);
		await deps.chatService.deleteMessage(message);
	}

	return createApiProcedure<MiLocalUser>()(chatMessagesDeleteContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
