/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedChatRoomInvitation } from '../../../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { InferSchemaOutput } from '@orpc/contract';

import { type IdService } from '@features/runtime/backend/services/IdService.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { type ChatService } from '../../../../services/ChatService.js';
import { type ChatEntityService } from '../../../../serializers/ChatEntityService.js';
import { chatRoomsInvitationsInboxContract } from './inbox.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChatRoomsInvitationsInboxDependencies {
	chatEntityService: ChatEntityService;
	chatService: ChatService;
	idService: IdService;
}
export function createChatRoomsInvitationsInboxProcedure(deps: ChatRoomsInvitationsInboxDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsInboxContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsInboxContract['~orpc']['outputSchema']>>> {
		return (await run(ps, me)).map(toPackedChatRoomInvitation);
	}

	async function run(ps: InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsInboxContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const untilId = ps.untilId ?? (ps.untilDate ? deps.idService.gen(ps.untilDate!) : null);
		const sinceId = ps.sinceId ?? (ps.sinceDate ? deps.idService.gen(ps.sinceDate!) : null);

		await deps.chatService.checkChatAvailability(me.id, 'read');

		const invitations = await deps.chatService.getReceivedRoomInvitationsWithPagination(me.id, ps.limit, sinceId, untilId);
		return deps.chatEntityService.packRoomInvitations(invitations, me);
	}

	return createApiProcedure<MiLocalUser>()(chatRoomsInvitationsInboxContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
