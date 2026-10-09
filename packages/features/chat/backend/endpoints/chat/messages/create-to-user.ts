/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { ChatService } from '../../../services/ChatService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { readErrorId } from '../../../request.schema.js';
import { chatMessagesCreateToUserContract, chatMessagesCreateToUserPolicy, chatMessagesCreateToUserInput, chatMessagesCreateToUserOutput, chatMessagesCreateToUserErrors } from './create-to-user.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { ChatApiContext } from '../../../operations.js';

import type { DriveFilesRepository, MiUser } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '../../../../../users/backend/models/User.js';

export function createChatMessagesCreateToUserProcedure<Actor extends ApiActor>() {
	return implement(chatMessagesCreateToUserContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChatApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(chatMessagesCreateToUserPolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.chat.chatMessagesCreateToUser(input, context.principal));
}

@Injectable()
export class ChatMessagesCreateToUserOperation {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private getterService: GetterService,
		private chatService: ChatService,
	) {}
	async execute(ps: v.InferOutput<typeof chatMessagesCreateToUserInput>, me: MiLocalUser): Promise<v.InferOutput<typeof chatMessagesCreateToUserOutput>> {
		return v.parse(chatMessagesCreateToUserOutput, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<typeof chatMessagesCreateToUserInput>, me: MiLocalUser) {
		await this.chatService.checkChatAvailability(me.id, 'write');

		let file = null;
		if (ps.fileId != null) {
			file = await this.driveFilesRepository.findOneBy({
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

		const toUser = await this.getterService.getUser(ps.toUserId).catch((err: unknown) => {
			if (readErrorId(err) === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(chatMessagesCreateToUserErrors.noSuchUser);
			throw err;
		});

		return await this.chatService.createMessageToUser(me, toUser, {
			text: ps.text,
			file: file,
		});
	}
}
