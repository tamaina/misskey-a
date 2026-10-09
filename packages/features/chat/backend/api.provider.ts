/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import { createChatRouter } from './api.router.js';
import { ChatEntityService } from './serializers/ChatEntityService.js';
import { ChatService } from './services/ChatService.js';
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
type ChatRouter = ReturnType<typeof createChatRouter>;
/** Compose once after existing domain factories and initialization hooks are ready. */
@Injectable()
export class ChatApiProvider {
	private router: ChatRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): ChatRouter {
		if (this.router !== undefined) return this.router;
		this.router = createChatRouter({
			chatHistory: {
				chatEntityService: this.moduleRef.get(ChatEntityService, { strict: false }),
				chatService: this.moduleRef.get(ChatService, { strict: false }),
			},
			chatMessagesCreateToRoom: {
				driveFilesRepository: this.moduleRef.get<DriveFilesRepository>(DI.driveFilesRepository, { strict: false }),
				getterService: this.moduleRef.get(GetterService, { strict: false }),
				chatService: this.moduleRef.get(ChatService, { strict: false }),
			},
			chatMessagesCreateToUser: {
				driveFilesRepository: this.moduleRef.get<DriveFilesRepository>(DI.driveFilesRepository, { strict: false }),
				getterService: this.moduleRef.get(GetterService, { strict: false }),
				chatService: this.moduleRef.get(ChatService, { strict: false }),
			},
			chatMessagesDelete: {
				chatService: this.moduleRef.get(ChatService, { strict: false }),
			},
			chatMessagesReact: {
				chatService: this.moduleRef.get(ChatService, { strict: false }),
			},
			chatMessagesRoomTimeline: {
				chatEntityService: this.moduleRef.get(ChatEntityService, { strict: false }),
				chatService: this.moduleRef.get(ChatService, { strict: false }),
				idService: this.moduleRef.get(IdService, { strict: false }),
			},
			chatMessagesSearch: {
				chatEntityService: this.moduleRef.get(ChatEntityService, { strict: false }),
				chatService: this.moduleRef.get(ChatService, { strict: false }),
			},
			chatMessagesShow: {
				chatService: this.moduleRef.get(ChatService, { strict: false }),
				roleService: this.moduleRef.get(RoleService, { strict: false }),
				chatEntityService: this.moduleRef.get(ChatEntityService, { strict: false }),
			},
			chatMessagesUnreact: {
				chatService: this.moduleRef.get(ChatService, { strict: false }),
			},
			chatMessagesUserTimeline: {
				chatEntityService: this.moduleRef.get(ChatEntityService, { strict: false }),
				chatService: this.moduleRef.get(ChatService, { strict: false }),
				getterService: this.moduleRef.get(GetterService, { strict: false }),
				idService: this.moduleRef.get(IdService, { strict: false }),
			},
			chatReadAll: {
				chatService: this.moduleRef.get(ChatService, { strict: false }),
			},
			chatRoomsCreate: {
				chatService: this.moduleRef.get(ChatService, { strict: false }),
				chatEntityService: this.moduleRef.get(ChatEntityService, { strict: false }),
			},
			chatRoomsDelete: {
				chatService: this.moduleRef.get(ChatService, { strict: false }),
			},
			chatRoomsInvitationsCreate: {
				chatService: this.moduleRef.get(ChatService, { strict: false }),
				chatEntityService: this.moduleRef.get(ChatEntityService, { strict: false }),
			},
			chatRoomsInvitationsIgnore: {
				chatService: this.moduleRef.get(ChatService, { strict: false }),
			},
			chatRoomsInvitationsInbox: {
				chatEntityService: this.moduleRef.get(ChatEntityService, { strict: false }),
				chatService: this.moduleRef.get(ChatService, { strict: false }),
				idService: this.moduleRef.get(IdService, { strict: false }),
			},
			chatRoomsInvitationsOutbox: {
				chatService: this.moduleRef.get(ChatService, { strict: false }),
				chatEntityService: this.moduleRef.get(ChatEntityService, { strict: false }),
				idService: this.moduleRef.get(IdService, { strict: false }),
			},
			chatRoomsJoin: {
				chatService: this.moduleRef.get(ChatService, { strict: false }),
			},
			chatRoomsJoining: {
				chatService: this.moduleRef.get(ChatService, { strict: false }),
				chatEntityService: this.moduleRef.get(ChatEntityService, { strict: false }),
				idService: this.moduleRef.get(IdService, { strict: false }),
			},
			chatRoomsLeave: {
				chatService: this.moduleRef.get(ChatService, { strict: false }),
			},
			chatRoomsMembers: {
				chatService: this.moduleRef.get(ChatService, { strict: false }),
				chatEntityService: this.moduleRef.get(ChatEntityService, { strict: false }),
				idService: this.moduleRef.get(IdService, { strict: false }),
			},
			chatRoomsMute: {
				chatService: this.moduleRef.get(ChatService, { strict: false }),
			},
			chatRoomsOwned: {
				chatEntityService: this.moduleRef.get(ChatEntityService, { strict: false }),
				chatService: this.moduleRef.get(ChatService, { strict: false }),
				idService: this.moduleRef.get(IdService, { strict: false }),
			},
			chatRoomsShow: {
				chatService: this.moduleRef.get(ChatService, { strict: false }),
				chatEntityService: this.moduleRef.get(ChatEntityService, { strict: false }),
			},
			chatRoomsUpdate: {
				chatService: this.moduleRef.get(ChatService, { strict: false }),
				chatEntityService: this.moduleRef.get(ChatEntityService, { strict: false }),
			},
		});
		return this.router;
	}
}
