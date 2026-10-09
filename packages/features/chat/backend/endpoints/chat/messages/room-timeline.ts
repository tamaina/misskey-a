/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { implement } from '@orpc/server';
import { type IdService } from '@features/runtime/backend/services/IdService.js';
import * as v from 'valibot';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { type ChatService } from '../../../services/ChatService.js';
import { type ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { chatMessagesRoomTimelineContract, chatMessagesRoomTimelinePolicy, chatMessagesRoomTimelineErrors } from './room-timeline.contract.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface ChatMessagesRoomTimelineDependencies {
	chatEntityService: ChatEntityService;
	chatService: ChatService;
	idService: IdService;
}
export function createChatMessagesRoomTimelineProcedure(deps: ChatMessagesRoomTimelineDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatMessagesRoomTimelineContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesRoomTimelineContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(chatMessagesRoomTimelineContract['~orpc'].outputSchema), await run(ps, me));
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

	return implement(chatMessagesRoomTimelineContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(chatMessagesRoomTimelinePolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
