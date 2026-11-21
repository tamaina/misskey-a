/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedChatMessageLiteForRoom } from '../../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { InferSchemaOutput } from '@orpc/contract';

import { type GetterService } from '@features/api/backend/transport/GetterService.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { type ChatService } from '../../../services/ChatService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { chatMessagesCreateToRoomContract, chatMessagesCreateToRoomErrors } from './create-to-room.contract.js';
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChatMessagesCreateToRoomDependencies {
	driveFilesRepository: DriveFilesRepository;
	getterService: GetterService;
	chatService: ChatService;
}
export function createChatMessagesCreateToRoomProcedure(deps: ChatMessagesCreateToRoomDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatMessagesCreateToRoomContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesCreateToRoomContract['~orpc']['outputSchema']>>> {
		return toPackedChatMessageLiteForRoom(await run(ps, me));
	}

	async function run(ps: InferSchemaOutput<NonNullable<typeof chatMessagesCreateToRoomContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		await deps.chatService.checkChatAvailability(me.id, 'write');

		const room = await deps.chatService.findRoomById(ps.toRoomId);
		if (room == null) {
			throw apiError(chatMessagesCreateToRoomErrors.noSuchRoom);
		}

		let file = null;
		if (ps.fileId != null) {
			file = await deps.driveFilesRepository.findOneBy({
				id: ps.fileId,
				userId: me.id,
			});

			if (file == null) {
				throw apiError(chatMessagesCreateToRoomErrors.noSuchFile);
			}
		}

		// テキストが無いかつ添付ファイルも無かったらエラー
		if (ps.text == null && file == null) {
			throw apiError(chatMessagesCreateToRoomErrors.contentRequired);
		}

		return await deps.chatService.createMessageToRoom(me, room, {
			text: ps.text,
			file: file,
		});
	}

	return createApiProcedure<MiLocalUser>()(chatMessagesCreateToRoomContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
