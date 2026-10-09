/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { chatApiContract } from './api.contract.js';
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { ChatApiContext } from './operations.js';
import { createChatMessagesCreateToUserProcedure } from './endpoints/chat/messages/create-to-user.js';
import { createChatMessagesCreateToRoomProcedure } from './endpoints/chat/messages/create-to-room.js';
import { createChatMessagesDeleteProcedure } from './endpoints/chat/messages/delete.js';
import { createChatMessagesShowProcedure } from './endpoints/chat/messages/show.js';
import { createChatMessagesReactProcedure } from './endpoints/chat/messages/react.js';
import { createChatMessagesUnreactProcedure } from './endpoints/chat/messages/unreact.js';
import { createChatMessagesUserTimelineProcedure } from './endpoints/chat/messages/user-timeline.js';
import { createChatMessagesRoomTimelineProcedure } from './endpoints/chat/messages/room-timeline.js';
import { createChatMessagesSearchProcedure } from './endpoints/chat/messages/search.js';
import { createChatRoomsCreateProcedure } from './endpoints/chat/rooms/create.js';
import { createChatRoomsDeleteProcedure } from './endpoints/chat/rooms/delete.js';
import { createChatRoomsJoinProcedure } from './endpoints/chat/rooms/join.js';
import { createChatRoomsLeaveProcedure } from './endpoints/chat/rooms/leave.js';
import { createChatRoomsMuteProcedure } from './endpoints/chat/rooms/mute.js';
import { createChatRoomsShowProcedure } from './endpoints/chat/rooms/show.js';
import { createChatRoomsOwnedProcedure } from './endpoints/chat/rooms/owned.js';
import { createChatRoomsJoiningProcedure } from './endpoints/chat/rooms/joining.js';
import { createChatRoomsUpdateProcedure } from './endpoints/chat/rooms/update.js';
import { createChatRoomsMembersProcedure } from './endpoints/chat/rooms/members.js';
import { createChatRoomsInvitationsCreateProcedure } from './endpoints/chat/rooms/invitations/create.js';
import { createChatRoomsInvitationsIgnoreProcedure } from './endpoints/chat/rooms/invitations/ignore.js';
import { createChatRoomsInvitationsInboxProcedure } from './endpoints/chat/rooms/invitations/inbox.js';
import { createChatRoomsInvitationsOutboxProcedure } from './endpoints/chat/rooms/invitations/outbox.js';
import { createChatHistoryProcedure } from './endpoints/chat/history.js';
import { createChatReadAllProcedure } from './endpoints/chat/read-all.js';

export function createChatRouter<Actor extends ApiActor>() {
	return implement(chatApiContract).$context<ChatApiContext<Actor>>().router({
		chatMessagesCreateToUser: createChatMessagesCreateToUserProcedure<Actor>(),
		chatMessagesCreateToRoom: createChatMessagesCreateToRoomProcedure<Actor>(),
		chatMessagesDelete: createChatMessagesDeleteProcedure<Actor>(),
		chatMessagesShow: createChatMessagesShowProcedure<Actor>(),
		chatMessagesReact: createChatMessagesReactProcedure<Actor>(),
		chatMessagesUnreact: createChatMessagesUnreactProcedure<Actor>(),
		chatMessagesUserTimeline: createChatMessagesUserTimelineProcedure<Actor>(),
		chatMessagesRoomTimeline: createChatMessagesRoomTimelineProcedure<Actor>(),
		chatMessagesSearch: createChatMessagesSearchProcedure<Actor>(),
		chatRoomsCreate: createChatRoomsCreateProcedure<Actor>(),
		chatRoomsDelete: createChatRoomsDeleteProcedure<Actor>(),
		chatRoomsJoin: createChatRoomsJoinProcedure<Actor>(),
		chatRoomsLeave: createChatRoomsLeaveProcedure<Actor>(),
		chatRoomsMute: createChatRoomsMuteProcedure<Actor>(),
		chatRoomsShow: createChatRoomsShowProcedure<Actor>(),
		chatRoomsOwned: createChatRoomsOwnedProcedure<Actor>(),
		chatRoomsJoining: createChatRoomsJoiningProcedure<Actor>(),
		chatRoomsUpdate: createChatRoomsUpdateProcedure<Actor>(),
		chatRoomsMembers: createChatRoomsMembersProcedure<Actor>(),
		chatRoomsInvitationsCreate: createChatRoomsInvitationsCreateProcedure<Actor>(),
		chatRoomsInvitationsIgnore: createChatRoomsInvitationsIgnoreProcedure<Actor>(),
		chatRoomsInvitationsInbox: createChatRoomsInvitationsInboxProcedure<Actor>(),
		chatRoomsInvitationsOutbox: createChatRoomsInvitationsOutboxProcedure<Actor>(),
		chatHistory: createChatHistoryProcedure<Actor>(),
		chatReadAll: createChatReadAllProcedure<Actor>(),
	});
}
