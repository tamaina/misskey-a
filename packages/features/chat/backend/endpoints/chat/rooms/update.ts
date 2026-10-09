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
import { chatRoomsUpdateContract, chatRoomsUpdatePolicy, chatRoomsUpdateInput, chatRoomsUpdateOutput, chatRoomsUpdateErrors } from './update.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { ChatApiContext } from '../../../operations.js';

import type { MiLocalUser } from '../../../../../users/backend/models/User.js';

export function createChatRoomsUpdateProcedure<Actor extends ApiActor>() {
	return implement(chatRoomsUpdateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChatApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(chatRoomsUpdatePolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.chat.chatRoomsUpdate(input, context.principal));
}

@Injectable()
export class ChatRoomsUpdateOperation {
	constructor(
		private chatService: ChatService,
		private chatEntityService: ChatEntityService,
	) {}
	async execute(ps: v.InferOutput<typeof chatRoomsUpdateInput>, me: MiLocalUser): Promise<v.InferOutput<typeof chatRoomsUpdateOutput>> {
		return v.parse(chatRoomsUpdateOutput, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<typeof chatRoomsUpdateInput>, me: MiLocalUser) {
		await this.chatService.checkChatAvailability(me.id, 'write');

		const room = await this.chatService.findMyRoomById(me.id, ps.roomId);
		if (room == null) {
			throw apiError(chatRoomsUpdateErrors.noSuchRoom);
		}

		const updated = await this.chatService.updateRoom(room, {
			name: ps.name,
			description: ps.description,
		});

		return this.chatEntityService.packRoom(updated, me);
	}
}
