/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';

import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';

import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { ChatService } from '../../../services/ChatService.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { readErrorId } from '../../../request.schema.js';
import { chatMessagesUserTimelineContract, chatMessagesUserTimelinePolicy, chatMessagesUserTimelineInput, chatMessagesUserTimelineOutput, chatMessagesUserTimelineErrors } from './user-timeline.contract.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import type { ChatApiContext } from '../../../operations.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';

export function createChatMessagesUserTimelineProcedure<Actor extends ApiActor>() {
	return implement(chatMessagesUserTimelineContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChatApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(chatMessagesUserTimelinePolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.chat.chatMessagesUserTimeline(input, context.principal));
}

@Injectable()
export class ChatMessagesUserTimelineOperation {
	constructor(
		private chatEntityService: ChatEntityService,
		private chatService: ChatService,
		private getterService: GetterService,
		private idService: IdService,
	) {}
	async execute(ps: v.InferOutput<typeof chatMessagesUserTimelineInput>, me: MiLocalUser): Promise<v.InferOutput<typeof chatMessagesUserTimelineOutput>> {
		return v.parse(chatMessagesUserTimelineOutput, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<typeof chatMessagesUserTimelineInput>, me: MiLocalUser) {
		const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
		const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);

		await this.chatService.checkChatAvailability(me.id, 'read');

		const other = await this.getterService.getUser(ps.userId).catch((err: unknown) => {
			if (readErrorId(err) === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(chatMessagesUserTimelineErrors.noSuchUser);
			throw err;
		});

		const messages = await this.chatService.userTimeline(me.id, other.id, ps.limit, sinceId, untilId);

		this.chatService.readUserChatMessage(me.id, other.id);

		return await this.chatEntityService.packMessagesLiteFor1on1(messages);
	}
}
