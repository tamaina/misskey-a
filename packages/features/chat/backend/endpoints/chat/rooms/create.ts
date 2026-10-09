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
import { chatRoomsCreateContract, chatRoomsCreatePolicy, chatRoomsCreateInput, chatRoomsCreateOutput, chatRoomsCreateErrors } from './create.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { ChatApiContext } from '../../../operations.js';

import type { MiLocalUser } from '../../../../../users/backend/models/User.js';

export function createChatRoomsCreateProcedure<Actor extends ApiActor>() {
	return implement(chatRoomsCreateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChatApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(chatRoomsCreatePolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.chat.chatRoomsCreate(input, context.principal));
}

@Injectable()
export class ChatRoomsCreateOperation {
	constructor(
		private chatService: ChatService,
		private chatEntityService: ChatEntityService,
	) {}
	async execute(ps: v.InferOutput<typeof chatRoomsCreateInput>, me: MiLocalUser): Promise<v.InferOutput<typeof chatRoomsCreateOutput>> {
		return v.parse(chatRoomsCreateOutput, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<typeof chatRoomsCreateInput>, me: MiLocalUser) {
		await this.chatService.checkChatAvailability(me.id, 'write');

		const room = await this.chatService.createRoom(me, {
			name: ps.name,
			description: ps.description ?? '',
		});
		return await this.chatEntityService.packRoom(room);
	}
}
