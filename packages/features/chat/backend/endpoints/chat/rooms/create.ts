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
import { chatRoomsCreateContract, chatRoomsCreatePolicy } from './create.contract.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface ChatRoomsCreateDependencies {
	chatService: ChatService;
	chatEntityService: ChatEntityService;
}
export function createChatRoomsCreateProcedure(deps: ChatRoomsCreateDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatRoomsCreateContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsCreateContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(chatRoomsCreateContract['~orpc'].outputSchema), await run(ps, me));
	}

	async function run(ps: InferSchemaOutput<NonNullable<typeof chatRoomsCreateContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		await deps.chatService.checkChatAvailability(me.id, 'write');

		const room = await deps.chatService.createRoom(me, {
			name: ps.name,
			description: ps.description ?? '',
		});
		return await deps.chatEntityService.packRoom(room);
	}

	return implement(chatRoomsCreateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(chatRoomsCreatePolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
