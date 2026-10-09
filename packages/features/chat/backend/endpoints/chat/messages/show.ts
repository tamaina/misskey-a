/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { implement } from '@orpc/server';
import { type RoleService } from '@features/roles/backend/services/RoleService.js';
import * as v from 'valibot';
import { type ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { type ChatService } from '../../../services/ChatService.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { chatMessagesShowContract, chatMessagesShowPolicy, chatMessagesShowErrors } from './show.contract.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface ChatMessagesShowDependencies {
	chatService: ChatService;
	roleService: RoleService;
	chatEntityService: ChatEntityService;
}
export function createChatMessagesShowProcedure(deps: ChatMessagesShowDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatMessagesShowContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesShowContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(chatMessagesShowContract['~orpc'].outputSchema), await run(ps, me));
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

	return implement(chatMessagesShowContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(chatMessagesShowPolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
