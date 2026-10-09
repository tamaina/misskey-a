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
import { chatMessagesCreateToRoomContract, chatMessagesCreateToRoomPolicy, chatMessagesCreateToRoomInput, chatMessagesCreateToRoomOutput, chatMessagesCreateToRoomErrors } from './create-to-room.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { ChatApiContext } from '../../../operations.js';

import type { DriveFilesRepository, MiUser } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '../../../../../users/backend/models/User.js';

export function createChatMessagesCreateToRoomProcedure<Actor extends ApiActor>() {
	return implement(chatMessagesCreateToRoomContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChatApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(chatMessagesCreateToRoomPolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.chat.chatMessagesCreateToRoom(input, context.principal));
}

@Injectable()
export class ChatMessagesCreateToRoomOperation {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private getterService: GetterService,
		private chatService: ChatService,
	) {}
	async execute(ps: v.InferOutput<typeof chatMessagesCreateToRoomInput>, me: MiLocalUser): Promise<v.InferOutput<typeof chatMessagesCreateToRoomOutput>> {
		return v.parse(chatMessagesCreateToRoomOutput, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<typeof chatMessagesCreateToRoomInput>, me: MiLocalUser) {
		await this.chatService.checkChatAvailability(me.id, 'write');

		const room = await this.chatService.findRoomById(ps.toRoomId);
		if (room == null) {
			throw apiError(chatMessagesCreateToRoomErrors.noSuchRoom);
		}

		let file = null;
		if (ps.fileId != null) {
			file = await this.driveFilesRepository.findOneBy({
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

		return await this.chatService.createMessageToRoom(me, room, {
			text: ps.text,
			file: file,
		});
	}
}
