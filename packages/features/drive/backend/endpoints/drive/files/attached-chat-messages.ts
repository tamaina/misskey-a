/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { driveFilesAttachedChatMessagesErrors } from './attached-chat-messages.contract.js';
import type { DriveFilesRepository, ChatMessagesRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { ChatEntityService } from '@features/chat/backend/serializers/ChatEntityService.js';
import { ChatService } from '@features/chat/backend/services/ChatService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { driveManagementContract } from '../../../management.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface DriveFilesAttachedChatMessagesDependencies {
	driveFilesRepository: DriveFilesRepository;
	chatMessagesRepository: ChatMessagesRepository;
	chatService: Pick<ChatService, 'checkChatAvailability'>;
	chatEntityService: Pick<ChatEntityService, 'packMessagesDetailed'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
	roleService: Pick<RoleService, 'isModerator'>;
}
export function createDriveFilesAttachedChatMessagesProcedure(deps: DriveFilesAttachedChatMessagesDependencies) {
	return implement(driveManagementContract['drive/files/attached-chat-messages'], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ 'name': 'drive/files/attached-chat-messages', 'requireCredential': true, 'kind': 'read:drive' })).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const _ip = context.ip;
			const _headers = context.headers;
			const isModerator = await deps.roleService.isModerator(me);

			if (!isModerator) {
				await deps.chatService.checkChatAvailability(me.id, 'read');
			}

			const file = await deps.driveFilesRepository.findOneBy({
				id: ps.fileId,
				userId: isModerator ? undefined : me.id,
			});

			if (file == null) {
				throw apiError(driveFilesAttachedChatMessagesErrors.noSuchFile);
			}

			const query = deps.queryService.makePaginationQuery(deps.chatMessagesRepository.createQueryBuilder('message'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);
			query.andWhere('message.fileId = :fileId', { fileId: file.id });

			const messages = await query.limit(ps.limit).getMany();

			return await deps.chatEntityService.packMessagesDetailed(messages, me);
		});
}
