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
import { chatRoomsJoiningContract } from './joining.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChatRoomsJoiningDependencies {
	chatService: ChatService;
	chatEntityService: ChatEntityService;
	idService: IdService;
}
export function createChatRoomsJoiningProcedure(deps: ChatRoomsJoiningDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatRoomsJoiningContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsJoiningContract['~orpc']['outputSchema']>>> {
		return (await run(ps, me)).map(toPackedChatRoomMembership);
	}

	async function run(ps: InferSchemaOutput<NonNullable<typeof chatRoomsJoiningContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const untilId = ps.untilId ?? (ps.untilDate ? deps.idService.gen(ps.untilDate!) : null);
		const sinceId = ps.sinceId ?? (ps.sinceDate ? deps.idService.gen(ps.sinceDate!) : null);

		await deps.chatService.checkChatAvailability(me.id, 'read');

		const memberships = await deps.chatService.getMyMemberships(me.id, ps.limit, sinceId, untilId);

		return deps.chatEntityService.packRoomMemberships(memberships, me, {
			populateUser: false,
			populateRoom: true,
		});
	}

	return createApiProcedure<MiLocalUser>()(chatRoomsJoiningContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
