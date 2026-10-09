/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';

import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';

import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { ChatService } from '../../../services/ChatService.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { chatMessagesShowContract, chatMessagesShowPolicy, chatMessagesShowInput, chatMessagesShowOutput, chatMessagesShowErrors } from './show.contract.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import type { ChatApiContext } from '../../../operations.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';

export function createChatMessagesShowProcedure<Actor extends ApiActor>() {
	return implement(chatMessagesShowContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChatApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(chatMessagesShowPolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.chat.chatMessagesShow(input, context.principal));
}

@Injectable()
export class ChatMessagesShowOperation {
	constructor(
		private chatService: ChatService,
		private roleService: RoleService,
		private chatEntityService: ChatEntityService,
	) {}
	async execute(ps: v.InferOutput<typeof chatMessagesShowInput>, me: MiLocalUser): Promise<v.InferOutput<typeof chatMessagesShowOutput>> {
		return v.parse(chatMessagesShowOutput, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<typeof chatMessagesShowInput>, me: MiLocalUser) {
		await this.chatService.checkChatAvailability(me.id, 'read');

		const message = await this.chatService.findMessageById(ps.messageId);
		if (message == null) {
			throw apiError(chatMessagesShowErrors.noSuchMessage);
		}
		if (message.fromUserId !== me.id && message.toUserId !== me.id && !(await this.roleService.isModerator(me))) {
			throw apiError(chatMessagesShowErrors.noSuchMessage);
		}
		return this.chatEntityService.packMessageDetailed(message, me);
	}
}
