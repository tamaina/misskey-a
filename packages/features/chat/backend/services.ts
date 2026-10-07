/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '../../index/backend/service-definitions.js';
import { ports } from '../../index/backend/service-ports.js';
import { ChatEntityService } from './serializers/ChatEntityService.js';
import type { Inputs, Outputs } from '../../index/backend/service-definitions.js';

export const chatServices = defineServices({
	ChatEntityService: service(ChatEntityService, [ports.chatMessagesRepository, ports.chatRoomsRepository, ports.chatRoomInvitationsRepository, ports.chatRoomMembershipsRepository, ports.userEntityService, ports.driveFileEntityService, ports.idService]),
});
export const createChatServices = chatServices.create;
export type ChatServicesDependencies = Inputs<typeof chatServices>;
export type ChatServices = Outputs<typeof chatServices>;
