/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedChatRoomInvitation } from '../../../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { InferSchemaOutput } from '@orpc/contract';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { type ChatService } from '../../../../services/ChatService.js';
import { type ChatEntityService } from '../../../../serializers/ChatEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { chatRoomsInvitationsCreateContract, chatRoomsInvitationsCreateErrors } from './create.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChatRoomsInvitationsCreateDependencies {
	chatService: ChatService;
	chatEntityService: ChatEntityService;
}
export function createChatRoomsInvitationsCreateProcedure(deps: ChatRoomsInvitationsCreateDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsCreateContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsCreateContract['~orpc']['outputSchema']>>> {
		return toPackedChatRoomInvitation(await run(ps, me));
	}

	async function run(ps: InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsCreateContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		await deps.chatService.checkChatAvailability(me.id, 'write');

		const room = await deps.chatService.findMyRoomById(me.id, ps.roomId);
		if (room == null) {
			throw apiError(chatRoomsInvitationsCreateErrors.noSuchRoom);
		}
		const invitation = await deps.chatService.createRoomInvitation(me.id, room.id, ps.userId);
		return await deps.chatEntityService.packRoomInvitation(invitation, me);
	}

	return createApiProcedure<MiLocalUser>()(chatRoomsInvitationsCreateContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
