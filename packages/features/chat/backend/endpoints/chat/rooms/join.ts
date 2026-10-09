/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { chatRoomsJoinContract } from './join.contract.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import type { InferSchemaOutput } from '@orpc/contract';
import { type ChatService } from '@features/chat/backend/services/ChatService.js';
export interface ChatRoomsJoinDependencies {
	chatService: Pick<ChatService, 'checkChatAvailability' | 'joinToRoom'>;
}
export function createChatRoomsJoinProcedure(deps: ChatRoomsJoinDependencies) {
	async function execute(input: InferSchemaOutput<NonNullable<typeof chatRoomsJoinContract['~orpc']['inputSchema']>>, actor: MiLocalUser): Promise<void> {
		await deps.chatService.checkChatAvailability(actor.id, 'write');
		await deps.chatService.joinToRoom(actor.id, input.roomId);
	}

	return createApiProcedure<MiLocalUser>()(chatRoomsJoinContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
