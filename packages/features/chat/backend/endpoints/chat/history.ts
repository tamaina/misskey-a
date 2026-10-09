/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { ChatService } from '../../services/ChatService.js';
import { ChatEntityService } from '../../serializers/ChatEntityService.js';
import { chatHistoryContract, chatHistoryPolicy, chatHistoryErrors } from './history.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { ChatApiContext } from '../../operations.js';

import type { MiLocalUser } from '../../../../users/backend/models/User.js';

export function createChatHistoryProcedure<Actor extends ApiActor>() {
	return implement(chatHistoryContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChatApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(chatHistoryPolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.chat.chatHistory(input, context.principal));
}

@Injectable()
export class ChatHistoryOperation {
	constructor(
		private chatEntityService: ChatEntityService,
		private chatService: ChatService,
	) {}
	async execute(ps: InferSchemaOutput<NonNullable<typeof chatHistoryContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatHistoryContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(chatHistoryContract['~orpc'].outputSchema), await this.run(ps, me));
	}

	private async run(ps: InferSchemaOutput<NonNullable<typeof chatHistoryContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		await this.chatService.checkChatAvailability(me.id, 'read');

		const history = ps.room ? await this.chatService.roomHistory(me.id, ps.limit) : await this.chatService.userHistory(me.id, ps.limit);

		const packedMessages = await this.chatEntityService.packMessagesDetailed(history, me);

		if (ps.room) {
			const roomIds = history.map(m => m.toRoomId!);
			const readStateMap = await this.chatService.getRoomReadStateMap(me.id, roomIds);

			for (const message of packedMessages) {
				message.isRead = readStateMap[message.toRoomId!] ?? false;
			}
		} else {
			const otherIds = history.map(m => m.fromUserId === me.id ? m.toUserId! : m.fromUserId!);
			const readStateMap = await this.chatService.getUserReadStateMap(me.id, otherIds);

			for (const message of packedMessages) {
				const otherId = message.fromUserId === me.id ? message.toUserId! : message.fromUserId!;
				message.isRead = readStateMap[otherId] ?? false;
			}
		}

		return packedMessages;
	}
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
