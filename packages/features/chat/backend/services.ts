/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '@features/index/backend/service-definitions.js';
import { ports } from '@features/index/backend/service-ports.js';
import { ChatEntityService } from './serializers/ChatEntityService.js';

export const chatServices = defineServices({
	ChatEntityService: service(ChatEntityService, [ports.chatMessagesRepository, ports.chatRoomsRepository, ports.chatRoomInvitationsRepository, ports.chatRoomMembershipsRepository, ports.userEntityService, ports.driveFileEntityService, ports.idService]),
});
