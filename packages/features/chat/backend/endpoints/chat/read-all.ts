/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { chatReadAllContract } from './read-all.contract.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import type { InferSchemaOutput } from '@orpc/contract';
import { type ChatService } from '@features/chat/backend/services/ChatService.js';
export interface ChatReadAllDependencies {
	chatService: Pick<ChatService, 'checkChatAvailability' | 'readAllChatMessages'>;
}
export function createChatReadAllProcedure(deps: ChatReadAllDependencies) {
	async function execute(input: InferSchemaOutput<NonNullable<typeof chatReadAllContract['~orpc']['inputSchema']>>, actor: MiLocalUser): Promise<void> {
		await deps.chatService.checkChatAvailability(actor.id, 'read');
		await deps.chatService.readAllChatMessages(actor.id);
	}

	return createApiProcedure<MiLocalUser>()(chatReadAllContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
