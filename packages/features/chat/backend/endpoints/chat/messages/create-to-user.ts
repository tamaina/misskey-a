/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedChatMessageLiteFor1on1 } from '../../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { InferSchemaOutput } from '@orpc/contract';

import { type GetterService } from '@features/api/backend/transport/GetterService.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { type ChatService } from '../../../services/ChatService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { readErrorId } from '../../../request.schema.js';
import { chatMessagesCreateToUserContract, chatMessagesCreateToUserErrors } from './create-to-user.contract.js';
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChatMessagesCreateToUserDependencies {
	driveFilesRepository: DriveFilesRepository;
	getterService: GetterService;
	chatService: ChatService;
}
export function createChatMessagesCreateToUserProcedure(deps: ChatMessagesCreateToUserDependencies) {
	async function execute(ps: InferSchemaOutput<NonNullable<typeof chatMessagesCreateToUserContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesCreateToUserContract['~orpc']['outputSchema']>>> {
		return toPackedChatMessageLiteFor1on1(await run(ps, me));
	}

	async function run(ps: InferSchemaOutput<NonNullable<typeof chatMessagesCreateToUserContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		await deps.chatService.checkChatAvailability(me.id, 'write');

		let file = null;
		if (ps.fileId != null) {
			file = await deps.driveFilesRepository.findOneBy({
				id: ps.fileId,
				userId: me.id,
			});

			if (file == null) {
				throw apiError(chatMessagesCreateToUserErrors.noSuchFile);
			}
		}

		// テキストが無いかつ添付ファイルも無かったらエラー
		if (ps.text == null && file == null) {
			throw apiError(chatMessagesCreateToUserErrors.contentRequired);
		}

		// Myself
		if (ps.toUserId === me.id) {
			throw apiError(chatMessagesCreateToUserErrors.recipientIsYourself);
		}

		const toUser = await deps.getterService.getUser(ps.toUserId).catch((err: unknown) => {
			if (readErrorId(err) === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(chatMessagesCreateToUserErrors.noSuchUser);
			throw err;
		});

		return await deps.chatService.createMessageToUser(me, toUser, {
			text: ps.text,
			file: file,
		});
	}

	return createApiProcedure<MiLocalUser>()(chatMessagesCreateToUserContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(({ input, context }) => execute(input, context.principal));
}
