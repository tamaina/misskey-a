/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../../api/backend/transport/middleware.js';
import { ChatService } from '../../../../services/ChatService.js';
import { ChatEntityService } from '../../../../serializers/ChatEntityService.js';
import { apiError } from '../../../../../../api/backend/transport/orpc-error.js';
import { chatRoomsInvitationsCreateContract, chatRoomsInvitationsCreatePolicy, chatRoomsInvitationsCreateErrors } from './create.contract.js';
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
	async execute(ps: InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsCreateContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsCreateContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(chatRoomsInvitationsCreateContract['~orpc'].outputSchema), await this.run(ps, me));
	}

	private async run(ps: InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsCreateContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		await this.chatService.checkChatAvailability(me.id, 'write');

		const room = await this.chatService.findMyRoomById(me.id, ps.roomId);
		if (room == null) {
			throw apiError(chatRoomsInvitationsCreateErrors.noSuchRoom);
		}
		const invitation = await this.chatService.createRoomInvitation(me.id, room.id, ps.userId);
		return await this.chatEntityService.packRoomInvitation(invitation, me);
	}
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
