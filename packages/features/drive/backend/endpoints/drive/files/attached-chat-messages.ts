/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveManagementInputs } from '../../../management.contract.js';
import { driveFilesAttachedChatMessagesErrors } from './attached-chat-messages.contract.js';
import { Inject, Injectable } from '@nestjs/common';

import type { DriveFilesRepository, ChatMessagesRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { ChatEntityService } from '@features/chat/backend/serializers/ChatEntityService.js';
import { ChatService } from '@features/chat/backend/services/ChatService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

@Injectable()
export class DriveFilesAttachedChatMessagesOperation {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.chatMessagesRepository)
		private chatMessagesRepository: ChatMessagesRepository,

		private chatService: ChatService,
		private chatEntityService: ChatEntityService,
		private queryService: QueryService,
		private roleService: RoleService,
	) {
	}

	async execute(ps: DriveManagementInputs['drive/files/attached-chat-messages'], me: MiLocalUser, _ip: string, _headers: Record<string, string | string[] | undefined>) {
		const isModerator = await this.roleService.isModerator(me);

		if (!isModerator) {
			await this.chatService.checkChatAvailability(me.id, 'read');
		}

		const file = await this.driveFilesRepository.findOneBy({
			id: ps.fileId,
			userId: isModerator ? undefined : me.id,
		});

		if (file == null) {
			throw apiError(driveFilesAttachedChatMessagesErrors.noSuchFile);
		}

		const query = this.queryService.makePaginationQuery(this.chatMessagesRepository.createQueryBuilder('message'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);
		query.andWhere('message.fileId = :fileId', { fileId: file.id });

		const messages = await query.limit(ps.limit).getMany();

		return await this.chatEntityService.packMessagesDetailed(messages, me);
	}
}
