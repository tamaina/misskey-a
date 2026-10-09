/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { chatRoomsMuteContract, chatRoomsMutePolicy } from './mute.contract.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
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

	return implement(chatRoomsMuteContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(chatRoomsMutePolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
