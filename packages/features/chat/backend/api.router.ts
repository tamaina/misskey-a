/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { chatApiContract } from './api.contract.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createChatMessagesCreateToUserProcedure, type ChatMessagesCreateToUserDependencies } from './endpoints/chat/messages/create-to-user.js';
import { createChatMessagesCreateToRoomProcedure, type ChatMessagesCreateToRoomDependencies } from './endpoints/chat/messages/create-to-room.js';
import { createChatMessagesDeleteProcedure, type ChatMessagesDeleteDependencies } from './endpoints/chat/messages/delete.js';
import { createChatMessagesShowProcedure, type ChatMessagesShowDependencies } from './endpoints/chat/messages/show.js';
import { createChatMessagesReactProcedure, type ChatMessagesReactDependencies } from './endpoints/chat/messages/react.js';
import { createChatMessagesUnreactProcedure, type ChatMessagesUnreactDependencies } from './endpoints/chat/messages/unreact.js';
import { createChatMessagesUserTimelineProcedure, type ChatMessagesUserTimelineDependencies } from './endpoints/chat/messages/user-timeline.js';
import { createChatMessagesRoomTimelineProcedure, type ChatMessagesRoomTimelineDependencies } from './endpoints/chat/messages/room-timeline.js';
import { createChatMessagesSearchProcedure, type ChatMessagesSearchDependencies } from './endpoints/chat/messages/search.js';
import { createChatRoomsCreateProcedure, type ChatRoomsCreateDependencies } from './endpoints/chat/rooms/create.js';
import { createChatRoomsDeleteProcedure, type ChatRoomsDeleteDependencies } from './endpoints/chat/rooms/delete.js';
import { createChatRoomsJoinProcedure, type ChatRoomsJoinDependencies } from './endpoints/chat/rooms/join.js';
import { createChatRoomsLeaveProcedure, type ChatRoomsLeaveDependencies } from './endpoints/chat/rooms/leave.js';
import { createChatRoomsMuteProcedure, type ChatRoomsMuteDependencies } from './endpoints/chat/rooms/mute.js';
import { createChatRoomsShowProcedure, type ChatRoomsShowDependencies } from './endpoints/chat/rooms/show.js';
import { createChatRoomsOwnedProcedure, type ChatRoomsOwnedDependencies } from './endpoints/chat/rooms/owned.js';
import { createChatRoomsJoiningProcedure, type ChatRoomsJoiningDependencies } from './endpoints/chat/rooms/joining.js';
import { createChatRoomsUpdateProcedure, type ChatRoomsUpdateDependencies } from './endpoints/chat/rooms/update.js';
import { createChatRoomsMembersProcedure, type ChatRoomsMembersDependencies } from './endpoints/chat/rooms/members.js';
import { createChatRoomsInvitationsCreateProcedure, type ChatRoomsInvitationsCreateDependencies } from './endpoints/chat/rooms/invitations/create.js';
import { createChatRoomsInvitationsIgnoreProcedure, type ChatRoomsInvitationsIgnoreDependencies } from './endpoints/chat/rooms/invitations/ignore.js';
import { createChatRoomsInvitationsInboxProcedure, type ChatRoomsInvitationsInboxDependencies } from './endpoints/chat/rooms/invitations/inbox.js';
import { createChatRoomsInvitationsOutboxProcedure, type ChatRoomsInvitationsOutboxDependencies } from './endpoints/chat/rooms/invitations/outbox.js';
import { createChatHistoryProcedure, type ChatHistoryDependencies } from './endpoints/chat/history.js';
import { createChatReadAllProcedure, type ChatReadAllDependencies } from './endpoints/chat/read-all.js';
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
