/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedChatRoom } from '../../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { InferSchemaOutput } from '@orpc/contract';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { type ChatService } from '../../../services/ChatService.js';
import { type ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { chatRoomsShowContract, chatRoomsShowErrors } from './show.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChatRoomsShowDependencies {
	chatService: ChatService;
	chatEntityService: ChatEntityService;
}
export function createChatRoomsShowProcedure(deps: ChatRoomsShowDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatRoomsShowContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsShowContract['~orpc']['outputSchema']>>> {
		return toPackedChatRoom(await run(ps, me));
	}

	async function run(ps: InferSchemaOutput<NonNullable<typeof chatRoomsShowContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		await deps.chatService.checkChatAvailability(me.id, 'read');

		const room = await deps.chatService.findRoomById(ps.roomId);
		if (room == null) {
			throw apiError(chatRoomsShowErrors.noSuchRoom);
		}

		if (!await deps.chatService.hasPermissionToViewRoomInfo(me.id, room)) {
			throw apiError(chatRoomsShowErrors.noSuchRoom);
		}

		return deps.chatEntityService.packRoom(room, me);
	}

	return createApiProcedure<MiLocalUser>()(chatRoomsShowContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
