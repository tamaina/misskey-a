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
import { chatRoomsUpdateContract, chatRoomsUpdatePolicy, chatRoomsUpdateErrors } from './update.contract.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface ChatRoomsUpdateDependencies {
	chatService: ChatService;
	chatEntityService: ChatEntityService;
}
export function createChatRoomsUpdateProcedure(deps: ChatRoomsUpdateDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatRoomsUpdateContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsUpdateContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(chatRoomsUpdateContract['~orpc'].outputSchema), await run(ps, me));
	}

	async function run(ps: InferSchemaOutput<NonNullable<typeof chatRoomsUpdateContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		await deps.chatService.checkChatAvailability(me.id, 'write');

		const room = await deps.chatService.findMyRoomById(me.id, ps.roomId);
		if (room == null) {
			throw apiError(chatRoomsUpdateErrors.noSuchRoom);
		}

		const updated = await deps.chatService.updateRoom(room, {
			name: ps.name,
			description: ps.description,
		});

		return deps.chatEntityService.packRoom(updated, me);
	}

	return implement(chatRoomsUpdateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(chatRoomsUpdatePolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
