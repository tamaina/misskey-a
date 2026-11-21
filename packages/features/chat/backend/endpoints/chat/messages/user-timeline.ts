/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedChatMessageLiteFor1on1 } from '../../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { InferSchemaOutput } from '@orpc/contract';

import { type GetterService } from '@features/api/backend/transport/GetterService.js';
import { type IdService } from '@features/runtime/backend/services/IdService.js';

import { type ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { type ChatService } from '../../../services/ChatService.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { readErrorId } from '../../../request.schema.js';
import { chatMessagesUserTimelineContract, chatMessagesUserTimelineErrors } from './user-timeline.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChatMessagesUserTimelineDependencies {
	chatEntityService: ChatEntityService;
	chatService: ChatService;
	getterService: GetterService;
	idService: IdService;
}
export function createChatMessagesUserTimelineProcedure(deps: ChatMessagesUserTimelineDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatMessagesUserTimelineContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesUserTimelineContract['~orpc']['outputSchema']>>> {
		return (await run(ps, me)).map(toPackedChatMessageLiteFor1on1);
	}

	async function run(ps: InferSchemaOutput<NonNullable<typeof chatMessagesUserTimelineContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const untilId = ps.untilId ?? (ps.untilDate ? deps.idService.gen(ps.untilDate!) : null);
		const sinceId = ps.sinceId ?? (ps.sinceDate ? deps.idService.gen(ps.sinceDate!) : null);

		await deps.chatService.checkChatAvailability(me.id, 'read');

		const other = await deps.getterService.getUser(ps.userId).catch((err: unknown) => {
			if (readErrorId(err) === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(chatMessagesUserTimelineErrors.noSuchUser);
			throw err;
		});

		const messages = await deps.chatService.userTimeline(me.id, other.id, ps.limit, sinceId, untilId);

		deps.chatService.readUserChatMessage(me.id, other.id);

		return await deps.chatEntityService.packMessagesLiteFor1on1(messages);
	}

	return createApiProcedure<MiLocalUser>()(chatMessagesUserTimelineContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
