/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { chatRoomsLeaveContract, chatRoomsLeavePolicy } from './leave.contract.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { InferSchemaOutput } from '@orpc/contract';
import { type ChatService } from '@features/chat/backend/services/ChatService.js';
export interface ChatRoomsLeaveDependencies {
	chatService: Pick<ChatService, 'checkChatAvailability' | 'leaveRoom'>;
}
export function createChatRoomsLeaveProcedure(deps: ChatRoomsLeaveDependencies) {
	async function execute(input: InferSchemaOutput<NonNullable<typeof chatRoomsLeaveContract['~orpc']['inputSchema']>>, actor: MiLocalUser): Promise<void> {
		await deps.chatService.checkChatAvailability(actor.id, 'write');
		await deps.chatService.leaveRoom(actor.id, input.roomId);
	}

	return implement(chatRoomsLeaveContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(chatRoomsLeavePolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
