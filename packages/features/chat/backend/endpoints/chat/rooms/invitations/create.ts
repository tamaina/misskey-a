/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../../api/backend/transport/middleware.js';
import { ChatService } from '../../../../services/ChatService.js';
import { ChatEntityService } from '../../../../serializers/ChatEntityService.js';
import { apiError } from '../../../../../../api/backend/transport/orpc-error.js';
import { chatRoomsInvitationsCreateContract, chatRoomsInvitationsCreatePolicy, chatRoomsInvitationsCreateInput, chatRoomsInvitationsCreateOutput, chatRoomsInvitationsCreateErrors } from './create.contract.js';
import type { ApiActor } from '../../../../../../api/backend/transport/context.js';
import type { ChatApiContext } from '../../../../operations.js';

import type { MiLocalUser } from '../../../../../../users/backend/models/User.js';

export function createChatRoomsInvitationsCreateProcedure<Actor extends ApiActor>() {
	return implement(chatRoomsInvitationsCreateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChatApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(chatRoomsInvitationsCreatePolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.chat.chatRoomsInvitationsCreate(input, context.principal));
}

@Injectable()
export class ChatRoomsInvitationsCreateOperation {
	constructor(
		private chatService: ChatService,
		private chatEntityService: ChatEntityService,
	) {}
	async execute(ps: v.InferOutput<typeof chatRoomsInvitationsCreateInput>, me: MiLocalUser): Promise<v.InferOutput<typeof chatRoomsInvitationsCreateOutput>> {
		return v.parse(chatRoomsInvitationsCreateOutput, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<typeof chatRoomsInvitationsCreateInput>, me: MiLocalUser) {
		await this.chatService.checkChatAvailability(me.id, 'write');

		const room = await this.chatService.findMyRoomById(me.id, ps.roomId);
		if (room == null) {
			throw apiError(chatRoomsInvitationsCreateErrors.noSuchRoom);
		}
		const invitation = await this.chatService.createRoomInvitation(me.id, room.id, ps.userId);
		return await this.chatEntityService.packRoomInvitation(invitation, me);
	}
}
