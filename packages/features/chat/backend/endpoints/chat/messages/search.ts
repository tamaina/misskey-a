/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedChatMessage } from '../../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { InferSchemaOutput } from '@orpc/contract';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { type ChatService } from '../../../services/ChatService.js';
import { type ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { chatMessagesSearchContract, chatMessagesSearchErrors } from './search.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChatMessagesSearchDependencies {
	chatEntityService: ChatEntityService;
	chatService: ChatService;
}
export function createChatMessagesSearchProcedure(deps: ChatMessagesSearchDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatMessagesSearchContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesSearchContract['~orpc']['outputSchema']>>> {
		return (await run(ps, me)).map(toPackedChatMessage);
	}

	async function run(ps: InferSchemaOutput<NonNullable<typeof chatMessagesSearchContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		await deps.chatService.checkChatAvailability(me.id, 'read');

		if (ps.roomId != null) {
			const room = await deps.chatService.findRoomById(ps.roomId);
			if (room == null) {
				throw apiError(chatMessagesSearchErrors.noSuchRoom);
			}

			if (!(await deps.chatService.isRoomMember(room, me.id))) {
				throw apiError(chatMessagesSearchErrors.noSuchRoom);
			}
		}

		const messages = await deps.chatService.searchMessages(me.id, ps.query, ps.limit, {
			userId: ps.userId,
			roomId: ps.roomId,
		});

		return await deps.chatEntityService.packMessagesDetailed(messages, me);
	}

	return createApiProcedure<MiLocalUser>()(chatMessagesSearchContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
