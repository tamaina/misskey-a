/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { chatApiContract } from './api.definition.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createChatMessagesCreateToUserProcedure } from './endpoints/chat/messages/create-to-user.js';
import type { ChatMessagesCreateToUserDependencies } from './endpoints/chat/messages/create-to-user.js';
import { createChatMessagesCreateToRoomProcedure } from './endpoints/chat/messages/create-to-room.js';
import type { ChatMessagesCreateToRoomDependencies } from './endpoints/chat/messages/create-to-room.js';
import { createChatMessagesDeleteProcedure } from './endpoints/chat/messages/delete.js';
import type { ChatMessagesDeleteDependencies } from './endpoints/chat/messages/delete.js';
import { createChatMessagesShowProcedure } from './endpoints/chat/messages/show.js';
import type { ChatMessagesShowDependencies } from './endpoints/chat/messages/show.js';
import { createChatMessagesReactProcedure } from './endpoints/chat/messages/react.js';
import type { ChatMessagesReactDependencies } from './endpoints/chat/messages/react.js';
import { createChatMessagesUnreactProcedure } from './endpoints/chat/messages/unreact.js';
import type { ChatMessagesUnreactDependencies } from './endpoints/chat/messages/unreact.js';
import { createChatMessagesUserTimelineProcedure } from './endpoints/chat/messages/user-timeline.js';
import type { ChatMessagesUserTimelineDependencies } from './endpoints/chat/messages/user-timeline.js';
import { createChatMessagesRoomTimelineProcedure } from './endpoints/chat/messages/room-timeline.js';
import type { ChatMessagesRoomTimelineDependencies } from './endpoints/chat/messages/room-timeline.js';
import { createChatMessagesSearchProcedure } from './endpoints/chat/messages/search.js';
import type { ChatMessagesSearchDependencies } from './endpoints/chat/messages/search.js';
import { createChatRoomsCreateProcedure } from './endpoints/chat/rooms/create.js';
import type { ChatRoomsCreateDependencies } from './endpoints/chat/rooms/create.js';
import { createChatRoomsDeleteProcedure } from './endpoints/chat/rooms/delete.js';
import type { ChatRoomsDeleteDependencies } from './endpoints/chat/rooms/delete.js';
import { createChatRoomsJoinProcedure } from './endpoints/chat/rooms/join.js';
import type { ChatRoomsJoinDependencies } from './endpoints/chat/rooms/join.js';
import { createChatRoomsLeaveProcedure } from './endpoints/chat/rooms/leave.js';
import type { ChatRoomsLeaveDependencies } from './endpoints/chat/rooms/leave.js';
import { createChatRoomsMuteProcedure } from './endpoints/chat/rooms/mute.js';
import type { ChatRoomsMuteDependencies } from './endpoints/chat/rooms/mute.js';
import { createChatRoomsShowProcedure } from './endpoints/chat/rooms/show.js';
import type { ChatRoomsShowDependencies } from './endpoints/chat/rooms/show.js';
import { createChatRoomsOwnedProcedure } from './endpoints/chat/rooms/owned.js';
import type { ChatRoomsOwnedDependencies } from './endpoints/chat/rooms/owned.js';
import { createChatRoomsJoiningProcedure } from './endpoints/chat/rooms/joining.js';
import type { ChatRoomsJoiningDependencies } from './endpoints/chat/rooms/joining.js';
import { createChatRoomsUpdateProcedure } from './endpoints/chat/rooms/update.js';
import type { ChatRoomsUpdateDependencies } from './endpoints/chat/rooms/update.js';
import { createChatRoomsMembersProcedure } from './endpoints/chat/rooms/members.js';
import type { ChatRoomsMembersDependencies } from './endpoints/chat/rooms/members.js';
import { createChatRoomsInvitationsCreateProcedure } from './endpoints/chat/rooms/invitations/create.js';
import type { ChatRoomsInvitationsCreateDependencies } from './endpoints/chat/rooms/invitations/create.js';
import { createChatRoomsInvitationsIgnoreProcedure } from './endpoints/chat/rooms/invitations/ignore.js';
import type { ChatRoomsInvitationsIgnoreDependencies } from './endpoints/chat/rooms/invitations/ignore.js';
import { createChatRoomsInvitationsInboxProcedure } from './endpoints/chat/rooms/invitations/inbox.js';
import type { ChatRoomsInvitationsInboxDependencies } from './endpoints/chat/rooms/invitations/inbox.js';
import { createChatRoomsInvitationsOutboxProcedure } from './endpoints/chat/rooms/invitations/outbox.js';
import type { ChatRoomsInvitationsOutboxDependencies } from './endpoints/chat/rooms/invitations/outbox.js';
import { createChatHistoryProcedure } from './endpoints/chat/history.js';
import type { ChatHistoryDependencies } from './endpoints/chat/history.js';
import { createChatReadAllProcedure } from './endpoints/chat/read-all.js';
import type { ChatReadAllDependencies } from './endpoints/chat/read-all.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import { ChatEntityService } from './serializers/ChatEntityService.js';
import { ChatService } from './services/ChatService.js';
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';

export interface ChatRouterDependencies {
	chatHistory: ChatHistoryDependencies;
	chatMessagesCreateToRoom: ChatMessagesCreateToRoomDependencies;
	chatMessagesCreateToUser: ChatMessagesCreateToUserDependencies;
	chatMessagesDelete: ChatMessagesDeleteDependencies;
	chatMessagesReact: ChatMessagesReactDependencies;
	chatMessagesRoomTimeline: ChatMessagesRoomTimelineDependencies;
	chatMessagesSearch: ChatMessagesSearchDependencies;
	chatMessagesShow: ChatMessagesShowDependencies;
	chatMessagesUnreact: ChatMessagesUnreactDependencies;
	chatMessagesUserTimeline: ChatMessagesUserTimelineDependencies;
	chatReadAll: ChatReadAllDependencies;
	chatRoomsCreate: ChatRoomsCreateDependencies;
	chatRoomsDelete: ChatRoomsDeleteDependencies;
	chatRoomsInvitationsCreate: ChatRoomsInvitationsCreateDependencies;
	chatRoomsInvitationsIgnore: ChatRoomsInvitationsIgnoreDependencies;
	chatRoomsInvitationsInbox: ChatRoomsInvitationsInboxDependencies;
	chatRoomsInvitationsOutbox: ChatRoomsInvitationsOutboxDependencies;
	chatRoomsJoin: ChatRoomsJoinDependencies;
	chatRoomsJoining: ChatRoomsJoiningDependencies;
	chatRoomsLeave: ChatRoomsLeaveDependencies;
	chatRoomsMembers: ChatRoomsMembersDependencies;
	chatRoomsMute: ChatRoomsMuteDependencies;
	chatRoomsOwned: ChatRoomsOwnedDependencies;
	chatRoomsShow: ChatRoomsShowDependencies;
	chatRoomsUpdate: ChatRoomsUpdateDependencies;
}

export function createChatRouter(deps: ChatRouterDependencies) {
	return implement(chatApiContract).$context<ApiContext<MiLocalUser>>().router({
		chatMessagesCreateToUser: createChatMessagesCreateToUserProcedure(deps.chatMessagesCreateToUser),
		chatMessagesCreateToRoom: createChatMessagesCreateToRoomProcedure(deps.chatMessagesCreateToRoom),
		chatMessagesDelete: createChatMessagesDeleteProcedure(deps.chatMessagesDelete),
		chatMessagesShow: createChatMessagesShowProcedure(deps.chatMessagesShow),
		chatMessagesReact: createChatMessagesReactProcedure(deps.chatMessagesReact),
		chatMessagesUnreact: createChatMessagesUnreactProcedure(deps.chatMessagesUnreact),
		chatMessagesUserTimeline: createChatMessagesUserTimelineProcedure(deps.chatMessagesUserTimeline),
		chatMessagesRoomTimeline: createChatMessagesRoomTimelineProcedure(deps.chatMessagesRoomTimeline),
		chatMessagesSearch: createChatMessagesSearchProcedure(deps.chatMessagesSearch),
		chatRoomsCreate: createChatRoomsCreateProcedure(deps.chatRoomsCreate),
		chatRoomsDelete: createChatRoomsDeleteProcedure(deps.chatRoomsDelete),
		chatRoomsJoin: createChatRoomsJoinProcedure(deps.chatRoomsJoin),
		chatRoomsLeave: createChatRoomsLeaveProcedure(deps.chatRoomsLeave),
		chatRoomsMute: createChatRoomsMuteProcedure(deps.chatRoomsMute),
		chatRoomsShow: createChatRoomsShowProcedure(deps.chatRoomsShow),
		chatRoomsOwned: createChatRoomsOwnedProcedure(deps.chatRoomsOwned),
		chatRoomsJoining: createChatRoomsJoiningProcedure(deps.chatRoomsJoining),
		chatRoomsUpdate: createChatRoomsUpdateProcedure(deps.chatRoomsUpdate),
		chatRoomsMembers: createChatRoomsMembersProcedure(deps.chatRoomsMembers),
		chatRoomsInvitationsCreate: createChatRoomsInvitationsCreateProcedure(deps.chatRoomsInvitationsCreate),
		chatRoomsInvitationsIgnore: createChatRoomsInvitationsIgnoreProcedure(deps.chatRoomsInvitationsIgnore),
		chatRoomsInvitationsInbox: createChatRoomsInvitationsInboxProcedure(deps.chatRoomsInvitationsInbox),
		chatRoomsInvitationsOutbox: createChatRoomsInvitationsOutboxProcedure(deps.chatRoomsInvitationsOutbox),
		chatHistory: createChatHistoryProcedure(deps.chatHistory),
		chatReadAll: createChatReadAllProcedure(deps.chatReadAll),
	});
}

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
