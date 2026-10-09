/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { implement } from '@orpc/server';
import * as v from 'valibot';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { type ChatService } from '../../services/ChatService.js';
import { type ChatEntityService } from '../../serializers/ChatEntityService.js';
import { chatHistoryContract, chatHistoryPolicy } from './history.contract.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface ChatHistoryDependencies {
	chatEntityService: ChatEntityService;
	chatService: ChatService;
}
export function createChatHistoryProcedure(deps: ChatHistoryDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatHistoryContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatHistoryContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(chatHistoryContract['~orpc'].outputSchema), await run(ps, me));
	}

	async function run(ps: InferSchemaOutput<NonNullable<typeof chatHistoryContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		await deps.chatService.checkChatAvailability(me.id, 'read');

		const history = ps.room ? await deps.chatService.roomHistory(me.id, ps.limit) : await deps.chatService.userHistory(me.id, ps.limit);

		const packedMessages = await deps.chatEntityService.packMessagesDetailed(history, me);

		if (ps.room) {
			const roomIds = history.map(m => m.toRoomId!);
			const readStateMap = await deps.chatService.getRoomReadStateMap(me.id, roomIds);

			for (const message of packedMessages) {
				message.isRead = readStateMap[message.toRoomId!] ?? false;
			}
		} else {
			const otherIds = history.map(m => m.fromUserId === me.id ? m.toUserId! : m.fromUserId!);
			const readStateMap = await deps.chatService.getUserReadStateMap(me.id, otherIds);

			for (const message of packedMessages) {
				const otherId = message.fromUserId === me.id ? message.toUserId! : message.fromUserId!;
				message.isRead = readStateMap[otherId] ?? false;
			}
		}

		return packedMessages;
	}

	return implement(chatHistoryContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(chatHistoryPolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
