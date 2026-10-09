/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { ChatService } from '../../../services/ChatService.js';
import { ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { chatRoomsJoiningContract, chatRoomsJoiningPolicy, chatRoomsJoiningInput, chatRoomsJoiningOutput, chatRoomsJoiningErrors } from './joining.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { ChatApiContext } from '../../../operations.js';

import type { MiLocalUser } from '../../../../../users/backend/models/User.js';

export function createChatRoomsJoiningProcedure<Actor extends ApiActor>() {
	return implement(chatRoomsJoiningContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChatApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(chatRoomsJoiningPolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.chat.chatRoomsJoining(input, context.principal));
}

@Injectable()
export class ChatRoomsJoiningOperation {
	constructor(
		private chatService: ChatService,
		private chatEntityService: ChatEntityService,
		private idService: IdService,
	) {}
	async execute(ps: v.InferOutput<typeof chatRoomsJoiningInput>, me: MiLocalUser): Promise<v.InferOutput<typeof chatRoomsJoiningOutput>> {
		return v.parse(chatRoomsJoiningOutput, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<typeof chatRoomsJoiningInput>, me: MiLocalUser) {
		const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
		const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);

		await this.chatService.checkChatAvailability(me.id, 'read');

		const memberships = await this.chatService.getMyMemberships(me.id, ps.limit, sinceId, untilId);

		return this.chatEntityService.packRoomMemberships(memberships, me, {
			populateUser: false,
			populateRoom: true,
		});
	}
}
