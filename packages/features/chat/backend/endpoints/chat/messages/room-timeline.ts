/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { ChatService } from '../../../services/ChatService.js';
import { ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { chatMessagesRoomTimelineContract, chatMessagesRoomTimelinePolicy, chatMessagesRoomTimelineErrors } from './room-timeline.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { ChatApiContext } from '../../../operations.js';

import type { MiLocalUser } from '../../../../../users/backend/models/User.js';

export function createChatMessagesRoomTimelineProcedure<Actor extends ApiActor>() {
	return implement(chatMessagesRoomTimelineContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChatApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(chatMessagesRoomTimelinePolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.chat.chatMessagesRoomTimeline(input, context.principal));
}

@Injectable()
export class ChatMessagesRoomTimelineOperation {
	constructor(
		private chatEntityService: ChatEntityService,
		private chatService: ChatService,
		private idService: IdService,
	) {}
	async execute(ps: InferSchemaOutput<NonNullable<typeof chatMessagesRoomTimelineContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesRoomTimelineContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(chatMessagesRoomTimelineContract['~orpc'].outputSchema), await this.run(ps, me));
	}

	private async run(ps: InferSchemaOutput<NonNullable<typeof chatMessagesRoomTimelineContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
		const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);

		await this.chatService.checkChatAvailability(me.id, 'read');

		const room = await this.chatService.findRoomById(ps.roomId);
		if (room == null) {
			throw apiError(chatMessagesRoomTimelineErrors.noSuchRoom);
		}

		if (!await this.chatService.hasPermissionToViewRoomTimeline(me.id, room)) {
			throw apiError(chatMessagesRoomTimelineErrors.noSuchRoom);
		}

		const messages = await this.chatService.roomTimeline(room.id, ps.limit, sinceId, untilId);

		this.chatService.readRoomChatMessage(me.id, room.id);

		return await this.chatEntityService.packMessagesLiteForRoom(messages);
	}
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
