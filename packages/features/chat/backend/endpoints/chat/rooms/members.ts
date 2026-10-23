/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedChatRoomMembership } from '../../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { InferSchemaOutput } from '@orpc/contract';

import { type IdService } from '@features/runtime/backend/services/IdService.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { type ChatService } from '../../../services/ChatService.js';
import { type ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { chatRoomsMembersContract, chatRoomsMembersErrors } from './members.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChatRoomsMembersDependencies {
	chatService: ChatService;
	chatEntityService: ChatEntityService;
	idService: IdService;
}
export function createChatRoomsMembersProcedure(deps: ChatRoomsMembersDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatRoomsMembersContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsMembersContract['~orpc']['outputSchema']>>> {
		return (await run(ps, me)).map(toPackedChatRoomMembership);
	}

	async function run(ps: InferSchemaOutput<NonNullable<typeof chatRoomsMembersContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const untilId = ps.untilId ?? (ps.untilDate ? deps.idService.gen(ps.untilDate!) : null);
		const sinceId = ps.sinceId ?? (ps.sinceDate ? deps.idService.gen(ps.sinceDate!) : null);

		await deps.chatService.checkChatAvailability(me.id, 'read');

		const room = await deps.chatService.findRoomById(ps.roomId);
		if (room == null) {
			throw apiError(chatRoomsMembersErrors.noSuchRoom);
		}

		if (!(await deps.chatService.isRoomMember(room, me.id))) {
			throw apiError(chatRoomsMembersErrors.noSuchRoom);
		}

		const memberships = await deps.chatService.getRoomMembershipsWithPagination(room.id, ps.limit, sinceId, untilId);

		return deps.chatEntityService.packRoomMemberships(memberships, me, {
			populateUser: true,
			populateRoom: false,
		});
	}

	return createApiProcedure<MiLocalUser>()(chatRoomsMembersContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
