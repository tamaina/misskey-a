/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { chatRoomsInvitationsIgnoreContract, chatRoomsInvitationsIgnorePolicy } from './ignore.contract.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../../api/backend/transport/middleware.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { InferSchemaOutput } from '@orpc/contract';
import { type ChatService } from '@features/chat/backend/services/ChatService.js';
export interface ChatRoomsInvitationsIgnoreDependencies {
	chatService: Pick<ChatService, 'checkChatAvailability' | 'ignoreRoomInvitation'>;
}
export function createChatRoomsInvitationsIgnoreProcedure(deps: ChatRoomsInvitationsIgnoreDependencies) {
	async function execute(input: InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsIgnoreContract['~orpc']['inputSchema']>>, actor: MiLocalUser): Promise<void> {
		await deps.chatService.checkChatAvailability(actor.id, 'write');
		await deps.chatService.ignoreRoomInvitation(actor.id, input.roomId);
	}

	return implement(chatRoomsInvitationsIgnoreContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(chatRoomsInvitationsIgnorePolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
