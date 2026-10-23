/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedChatMessageLiteForRoom } from '../../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { InferSchemaOutput } from '@orpc/contract';

import { type IdService } from '@features/runtime/backend/services/IdService.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { type ChatService } from '../../../services/ChatService.js';
import { type ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { chatMessagesRoomTimelineContract, chatMessagesRoomTimelineErrors } from './room-timeline.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChatMessagesRoomTimelineDependencies {
	chatEntityService: ChatEntityService;
	chatService: ChatService;
	idService: IdService;
}
export function createChatMessagesRoomTimelineProcedure(deps: ChatMessagesRoomTimelineDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatMessagesRoomTimelineContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesRoomTimelineContract['~orpc']['outputSchema']>>> {
		return (await run(ps, me)).map(toPackedChatMessageLiteForRoom);
	}

	async function run(ps: InferSchemaOutput<NonNullable<typeof chatMessagesRoomTimelineContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const untilId = ps.untilId ?? (ps.untilDate ? deps.idService.gen(ps.untilDate!) : null);
		const sinceId = ps.sinceId ?? (ps.sinceDate ? deps.idService.gen(ps.sinceDate!) : null);

		await deps.chatService.checkChatAvailability(me.id, 'read');

		const room = await deps.chatService.findRoomById(ps.roomId);
		if (room == null) {
			throw apiError(chatMessagesRoomTimelineErrors.noSuchRoom);
		}

		if (!await deps.chatService.hasPermissionToViewRoomTimeline(me.id, room)) {
			throw apiError(chatMessagesRoomTimelineErrors.noSuchRoom);
		}

		const messages = await deps.chatService.roomTimeline(room.id, ps.limit, sinceId, untilId);

		deps.chatService.readRoomChatMessage(me.id, room.id);

		return await deps.chatEntityService.packMessagesLiteForRoom(messages);
	}

	return createApiProcedure<MiLocalUser>()(chatMessagesRoomTimelineContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
