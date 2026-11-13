/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { chatRoomsMuteContract } from './mute.contract.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import type { InferSchemaOutput } from '@orpc/contract';
import { type ChatService } from '@features/chat/backend/services/ChatService.js';
export interface ChatRoomsMuteDependencies {
	chatService: Pick<ChatService, 'checkChatAvailability' | 'muteRoom'>;
}
export function createChatRoomsMuteProcedure(deps: ChatRoomsMuteDependencies) {
	async function execute(input: InferSchemaOutput<NonNullable<typeof chatRoomsMuteContract['~orpc']['inputSchema']>>, actor: MiLocalUser): Promise<void> {
		await deps.chatService.checkChatAvailability(actor.id, 'write');
		await deps.chatService.muteRoom(actor.id, input.roomId, input.mute);
	}

	return createApiProcedure<MiLocalUser>()(chatRoomsMuteContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
