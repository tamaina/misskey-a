/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedChatRoom } from '../../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { InferSchemaOutput } from '@orpc/contract';

import { type IdService } from '@features/runtime/backend/services/IdService.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { type ChatService } from '../../../services/ChatService.js';
import { type ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { chatRoomsOwnedContract } from './owned.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChatRoomsOwnedDependencies {
	chatEntityService: ChatEntityService;
	chatService: ChatService;
	idService: IdService;
}
export function createChatRoomsOwnedProcedure(deps: ChatRoomsOwnedDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatRoomsOwnedContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsOwnedContract['~orpc']['outputSchema']>>> {
		return (await run(ps, me)).map(toPackedChatRoom);
	}

	async function run(ps: InferSchemaOutput<NonNullable<typeof chatRoomsOwnedContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const untilId = ps.untilId ?? (ps.untilDate ? deps.idService.gen(ps.untilDate!) : null);
		const sinceId = ps.sinceId ?? (ps.sinceDate ? deps.idService.gen(ps.sinceDate!) : null);

		await deps.chatService.checkChatAvailability(me.id, 'read');

		const rooms = await deps.chatService.getOwnedRoomsWithPagination(me.id, ps.limit, sinceId, untilId);
		return deps.chatEntityService.packRooms(rooms, me);
	}

	return createApiProcedure<MiLocalUser>()(chatRoomsOwnedContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
