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
import { chatRoomsShowContract, chatRoomsShowPolicy, chatRoomsShowErrors } from './show.contract.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface ChatRoomsShowDependencies {
	chatService: ChatService;
	chatEntityService: ChatEntityService;
}
export function createChatRoomsShowProcedure(deps: ChatRoomsShowDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatRoomsShowContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsShowContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(chatRoomsShowContract['~orpc'].outputSchema), await run(ps, me));
	}

	async function run(ps: InferSchemaOutput<NonNullable<typeof chatRoomsShowContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		await deps.chatService.checkChatAvailability(me.id, 'read');

		const room = await deps.chatService.findRoomById(ps.roomId);
		if (room == null) {
			throw apiError(chatRoomsShowErrors.noSuchRoom);
		}

		if (!await deps.chatService.hasPermissionToViewRoomInfo(me.id, room)) {
			throw apiError(chatRoomsShowErrors.noSuchRoom);
		}

		return deps.chatEntityService.packRoom(room, me);
	}

	return implement(chatRoomsShowContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(chatRoomsShowPolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
