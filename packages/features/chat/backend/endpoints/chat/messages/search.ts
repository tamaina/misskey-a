/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { implement } from '@orpc/server';
import * as v from 'valibot';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { type ChatService } from '../../../services/ChatService.js';
import { type ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { chatMessagesSearchContract, chatMessagesSearchPolicy, chatMessagesSearchErrors } from './search.contract.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface ChatMessagesSearchDependencies {
	chatEntityService: ChatEntityService;
	chatService: ChatService;
}
export function createChatMessagesSearchProcedure(deps: ChatMessagesSearchDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatMessagesSearchContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesSearchContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(chatMessagesSearchContract['~orpc'].outputSchema), await run(ps, me));
	}

	async function run(ps: InferSchemaOutput<NonNullable<typeof chatMessagesSearchContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		await deps.chatService.checkChatAvailability(me.id, 'read');

		if (ps.roomId != null) {
			const room = await deps.chatService.findRoomById(ps.roomId);
			if (room == null) {
				throw apiError(chatMessagesSearchErrors.noSuchRoom);
			}

			if (!(await deps.chatService.isRoomMember(room, me.id))) {
				throw apiError(chatMessagesSearchErrors.noSuchRoom);
			}
		}

		const messages = await deps.chatService.searchMessages(me.id, ps.query, ps.limit, {
			userId: ps.userId,
			roomId: ps.roomId,
		});

		return await deps.chatEntityService.packMessagesDetailed(messages, me);
	}

	return implement(chatMessagesSearchContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(chatMessagesSearchPolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
