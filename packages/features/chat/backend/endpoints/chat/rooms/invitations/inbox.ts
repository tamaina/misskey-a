/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { implement } from '@orpc/server';
import { type IdService } from '@features/runtime/backend/services/IdService.js';
import * as v from 'valibot';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../../api/backend/transport/middleware.js';
import { type ChatService } from '../../../../services/ChatService.js';
import { type ChatEntityService } from '../../../../serializers/ChatEntityService.js';
import { chatRoomsInvitationsInboxContract, chatRoomsInvitationsInboxPolicy } from './inbox.contract.js';
import type { MiLocalUser } from '../../../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface ChatRoomsInvitationsInboxDependencies {
	chatEntityService: ChatEntityService;
	chatService: ChatService;
	idService: IdService;
}
export function createChatRoomsInvitationsInboxProcedure(deps: ChatRoomsInvitationsInboxDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsInboxContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsInboxContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(chatRoomsInvitationsInboxContract['~orpc'].outputSchema), await run(ps, me));
	}

	async function run(ps: InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsInboxContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const untilId = ps.untilId ?? (ps.untilDate ? deps.idService.gen(ps.untilDate!) : null);
		const sinceId = ps.sinceId ?? (ps.sinceDate ? deps.idService.gen(ps.sinceDate!) : null);

		await deps.chatService.checkChatAvailability(me.id, 'read');

		const invitations = await deps.chatService.getReceivedRoomInvitationsWithPagination(me.id, ps.limit, sinceId, untilId);
		return deps.chatEntityService.packRoomInvitations(invitations, me);
	}

	return implement(chatRoomsInvitationsInboxContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(chatRoomsInvitationsInboxPolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
