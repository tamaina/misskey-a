/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
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
import { chatMessagesShowContract, chatMessagesShowPolicy, chatMessagesShowErrors } from './show.contract.js';
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
	async execute(ps: InferSchemaOutput<NonNullable<typeof chatMessagesShowContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesShowContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(chatMessagesShowContract['~orpc'].outputSchema), await this.run(ps, me));
	}

	private async run(ps: InferSchemaOutput<NonNullable<typeof chatMessagesShowContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
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

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
