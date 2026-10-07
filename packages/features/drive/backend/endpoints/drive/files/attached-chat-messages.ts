/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedDriveFilesAttachedChatMessagesDefinition, packedDriveFilesAttachedChatMessagesInput, packedDriveFilesAttachedChatMessagesOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { DriveFilesRepository, ChatMessagesRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { ChatEntityService } from '@features/chat/backend/serializers/ChatEntityService.js';
import { ChatService } from '@features/chat/backend/services/ChatService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedDriveFilesAttachedChatMessagesDefinition);

export const meta = {
	tags: ['drive', 'chat'],

	requireCredential: true,

	kind: 'read:drive',

	res: contractProjection.response,

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: '485ce26d-f5d2-4313-9783-e689d131eafb',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedDriveFilesAttachedChatMessagesInput, typeof packedDriveFilesAttachedChatMessagesOutput> {
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
		super(meta, contractProjection, async (ps, me) => {
			const isModerator = await this.roleService.isModerator(me);

			if (!isModerator) {
				await this.chatService.checkChatAvailability(me.id, 'read');
			}

			const file = await this.driveFilesRepository.findOneBy({
				id: ps.fileId,
				userId: isModerator ? undefined : me.id,
			});

			if (file == null) {
				throw new ApiError(meta.errors.noSuchFile);
			}

			const query = this.queryService.makePaginationQuery(this.chatMessagesRepository.createQueryBuilder('message'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);
			query.andWhere('message.fileId = :fileId', { fileId: file.id });

			const messages = await query.limit(ps.limit).getMany();

			return await this.chatEntityService.packMessagesDetailed(messages, me);
		});
	}
}
