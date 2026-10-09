/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedChatMessage } from '../../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { InferSchemaOutput } from '@orpc/contract';

import { type RoleService } from '@features/roles/backend/services/RoleService.js';

import { type ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { type ChatService } from '../../../services/ChatService.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { chatMessagesShowContract, chatMessagesShowErrors } from './show.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChatMessagesShowDependencies {
	chatService: ChatService;
	roleService: RoleService;
	chatEntityService: ChatEntityService;
}
export function createChatMessagesShowProcedure(deps: ChatMessagesShowDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatMessagesShowContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesShowContract['~orpc']['outputSchema']>>> {
		return toPackedChatMessage(await run(ps, me));
	}

	async function run(ps: InferSchemaOutput<NonNullable<typeof chatMessagesShowContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		await deps.chatService.checkChatAvailability(me.id, 'read');

		const message = await deps.chatService.findMessageById(ps.messageId);
		if (message == null) {
			throw apiError(chatMessagesShowErrors.noSuchMessage);
		}
		if (message.fromUserId !== me.id && message.toUserId !== me.id && !(await deps.roleService.isModerator(me))) {
			throw apiError(chatMessagesShowErrors.noSuchMessage);
		}
		return deps.chatEntityService.packMessageDetailed(message, me);
	}

	return createApiProcedure<MiLocalUser>()(chatMessagesShowContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
