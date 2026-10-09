/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { ChatService } from '../../../services/ChatService.js';
import { ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { chatMessagesSearchContract, chatMessagesSearchPolicy, chatMessagesSearchErrors } from './search.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { ChatApiContext } from '../../../operations.js';

import type { MiLocalUser } from '../../../../../users/backend/models/User.js';

export function createChatMessagesSearchProcedure<Actor extends ApiActor>() {
	return implement(chatMessagesSearchContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChatApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(chatMessagesSearchPolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.chat.chatMessagesSearch(input, context.principal));
}

@Injectable()
export class ChatMessagesSearchOperation {
	constructor(
		private chatEntityService: ChatEntityService,
		private chatService: ChatService,
	) {}
	async execute(ps: InferSchemaOutput<NonNullable<typeof chatMessagesSearchContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesSearchContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(chatMessagesSearchContract['~orpc'].outputSchema), await this.run(ps, me));
	}

	private async run(ps: InferSchemaOutput<NonNullable<typeof chatMessagesSearchContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		await this.chatService.checkChatAvailability(me.id, 'read');

		if (ps.roomId != null) {
			const room = await this.chatService.findRoomById(ps.roomId);
			if (room == null) {
				throw apiError(chatMessagesSearchErrors.noSuchRoom);
			}

			if (!(await this.chatService.isRoomMember(room, me.id))) {
				throw apiError(chatMessagesSearchErrors.noSuchRoom);
			}
		}

		const messages = await this.chatService.searchMessages(me.id, ps.query, ps.limit, {
			userId: ps.userId,
			roomId: ps.roomId,
		});

		return await this.chatEntityService.packMessagesDetailed(messages, me);
	}
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
