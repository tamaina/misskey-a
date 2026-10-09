/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { ChatService } from '../../../services/ChatService.js';
import { ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { chatRoomsShowContract, chatRoomsShowPolicy, chatRoomsShowInput, chatRoomsShowOutput, chatRoomsShowErrors } from './show.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { ChatApiContext } from '../../../operations.js';

import type { MiLocalUser } from '../../../../../users/backend/models/User.js';

export function createChatRoomsShowProcedure<Actor extends ApiActor>() {
	return implement(chatRoomsShowContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChatApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(chatRoomsShowPolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.chat.chatRoomsShow(input, context.principal));
}

@Injectable()
export class ChatRoomsShowOperation {
	constructor(
		private chatService: ChatService,
		private chatEntityService: ChatEntityService,
	) {}
	async execute(ps: v.InferOutput<typeof chatRoomsShowInput>, me: MiLocalUser): Promise<v.InferOutput<typeof chatRoomsShowOutput>> {
		return v.parse(chatRoomsShowOutput, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<typeof chatRoomsShowInput>, me: MiLocalUser) {
		await this.chatService.checkChatAvailability(me.id, 'read');

		const room = await this.chatService.findRoomById(ps.roomId);
		if (room == null) {
			throw apiError(chatRoomsShowErrors.noSuchRoom);
		}

		if (!await this.chatService.hasPermissionToViewRoomInfo(me.id, room)) {
			throw apiError(chatRoomsShowErrors.noSuchRoom);
		}

		return this.chatEntityService.packRoom(room, me);
	}
}
