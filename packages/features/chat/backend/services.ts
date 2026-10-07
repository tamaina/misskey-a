/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ChatEntityService } from './serializers/ChatEntityService.js';
import type { ChatMessagesRepository, ChatRoomInvitationsRepository, ChatRoomMembershipsRepository, ChatRoomsRepository } from '@/models/_.js';
import type { UserEntityService } from '../../users/backend/serializers/UserEntityService.js';
import type { DriveFileEntityService } from '../../drive/backend/serializers/DriveFileEntityService.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';

export interface ChatServicesDependencies {
	chatMessagesRepository: ChatMessagesRepository;
	chatRoomsRepository: ChatRoomsRepository;
	chatRoomInvitationsRepository: ChatRoomInvitationsRepository;
	chatRoomMembershipsRepository: ChatRoomMembershipsRepository;
	userEntityService: Pick<UserEntityService, 'pack' | 'packMany'>;
	driveFileEntityService: Pick<DriveFileEntityService, 'pack' | 'packMany'>;
	idService: Pick<IdService, 'parse'>;
}

/** Compose this feature without starting resources or resolving a container. */
export function createChatServices(deps: ChatServicesDependencies) {
	const chatEntityService = new ChatEntityService(deps.chatMessagesRepository, deps.chatRoomsRepository, deps.chatRoomInvitationsRepository, deps.chatRoomMembershipsRepository, deps.userEntityService, deps.driveFileEntityService, deps.idService);

	return {
		ChatEntityService: chatEntityService,
	};
}

export type ChatServices = ReturnType<typeof createChatServices>;
