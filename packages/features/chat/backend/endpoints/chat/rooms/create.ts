/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedChatRoom } from '../../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { InferSchemaOutput } from '@orpc/contract';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { type ChatService } from '../../../services/ChatService.js';
import { type ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { chatRoomsCreateContract } from './create.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChatRoomsCreateDependencies {
	chatService: ChatService;
	chatEntityService: ChatEntityService;
}
export function createChatRoomsCreateProcedure(deps: ChatRoomsCreateDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatRoomsCreateContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsCreateContract['~orpc']['outputSchema']>>> {
		return toPackedChatRoom(await run(ps, me));
	}

	async function run(ps: InferSchemaOutput<NonNullable<typeof chatRoomsCreateContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		await deps.chatService.checkChatAvailability(me.id, 'write');

		const room = await deps.chatService.createRoom(me, {
			name: ps.name,
			description: ps.description ?? '',
		});
		return await deps.chatEntityService.packRoom(room);
	}

	return createApiProcedure<MiLocalUser>()(chatRoomsCreateContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
