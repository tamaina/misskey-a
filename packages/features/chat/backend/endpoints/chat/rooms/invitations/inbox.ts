/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../../api/backend/transport/middleware.js';
import { ChatService } from '../../../../services/ChatService.js';
import { ChatEntityService } from '../../../../serializers/ChatEntityService.js';
import { chatRoomsInvitationsInboxContract, chatRoomsInvitationsInboxPolicy, chatRoomsInvitationsInboxInput, chatRoomsInvitationsInboxOutput, chatRoomsInvitationsInboxErrors } from './inbox.contract.js';
import type { ApiActor } from '../../../../../../api/backend/transport/context.js';
import type { ChatApiContext } from '../../../../operations.js';

import type { MiLocalUser } from '../../../../../../users/backend/models/User.js';

export function createChatRoomsInvitationsInboxProcedure<Actor extends ApiActor>() {
	return implement(chatRoomsInvitationsInboxContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChatApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(chatRoomsInvitationsInboxPolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.chat.chatRoomsInvitationsInbox(input, context.principal));
}

@Injectable()
export class ChatRoomsInvitationsInboxOperation {
	constructor(
		private chatEntityService: ChatEntityService,
		private chatService: ChatService,
		private idService: IdService,
	) {}
	async execute(ps: v.InferOutput<typeof chatRoomsInvitationsInboxInput>, me: MiLocalUser): Promise<v.InferOutput<typeof chatRoomsInvitationsInboxOutput>> {
		return v.parse(chatRoomsInvitationsInboxOutput, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<typeof chatRoomsInvitationsInboxInput>, me: MiLocalUser) {
		const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
		const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);

		await this.chatService.checkChatAvailability(me.id, 'read');

		const invitations = await this.chatService.getReceivedRoomInvitationsWithPagination(me.id, ps.limit, sinceId, untilId);
		return this.chatEntityService.packRoomInvitations(invitations, me);
	}
}
