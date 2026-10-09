/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { chatRoomsDeleteContract, chatRoomsDeletePolicy } from './delete.contract.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { InferSchemaOutput } from '@orpc/contract';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { type ChatService } from '@features/chat/backend/services/ChatService.js';
import { chatRoomsDeleteErrors } from './delete.contract.js';
export interface ChatRoomsDeleteDependencies {
	chatService: Pick<ChatService, 'checkChatAvailability' | 'findRoomById' | 'hasPermissionToDeleteRoom' | 'deleteRoom'>;
}
export function createChatRoomsDeleteProcedure(deps: ChatRoomsDeleteDependencies) {
	async function execute(input: InferSchemaOutput<NonNullable<typeof chatRoomsDeleteContract['~orpc']['inputSchema']>>, actor: MiLocalUser): Promise<void> {
		await deps.chatService.checkChatAvailability(actor.id, 'write');
		const room = await deps.chatService.findRoomById(input.roomId);
		if (room == null || !await deps.chatService.hasPermissionToDeleteRoom(actor.id, room)) {
			throw apiError(chatRoomsDeleteErrors.noSuchRoom);
		}
		await deps.chatService.deleteRoom(room, actor);
	}

	return implement(chatRoomsDeleteContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(chatRoomsDeletePolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
