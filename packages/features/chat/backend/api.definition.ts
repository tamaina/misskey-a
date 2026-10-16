/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { chatMessagesCreateToUserContract } from './endpoints/chat/messages/create-to-user.contract.js';
import { chatMessagesCreateToRoomContract } from './endpoints/chat/messages/create-to-room.contract.js';
import { chatMessagesDeleteContract } from './endpoints/chat/messages/delete.contract.js';
import { chatMessagesShowContract } from './endpoints/chat/messages/show.contract.js';
import { chatMessagesReactContract } from './endpoints/chat/messages/react.contract.js';
import { chatMessagesUnreactContract } from './endpoints/chat/messages/unreact.contract.js';
import { chatMessagesUserTimelineContract } from './endpoints/chat/messages/user-timeline.contract.js';
import { chatMessagesRoomTimelineContract } from './endpoints/chat/messages/room-timeline.contract.js';
import { chatMessagesSearchContract } from './endpoints/chat/messages/search.contract.js';
import { chatRoomsCreateContract } from './endpoints/chat/rooms/create.contract.js';
import { chatRoomsDeleteContract } from './endpoints/chat/rooms/delete.contract.js';
import { chatRoomsJoinContract } from './endpoints/chat/rooms/join.contract.js';
import { chatRoomsLeaveContract } from './endpoints/chat/rooms/leave.contract.js';
import { chatRoomsMuteContract } from './endpoints/chat/rooms/mute.contract.js';
import { chatRoomsShowContract } from './endpoints/chat/rooms/show.contract.js';
import { chatRoomsOwnedContract } from './endpoints/chat/rooms/owned.contract.js';
import { chatRoomsJoiningContract } from './endpoints/chat/rooms/joining.contract.js';
import { chatRoomsUpdateContract } from './endpoints/chat/rooms/update.contract.js';
import { chatRoomsMembersContract } from './endpoints/chat/rooms/members.contract.js';
import { chatRoomsInvitationsCreateContract } from './endpoints/chat/rooms/invitations/create.contract.js';
import { chatRoomsInvitationsIgnoreContract } from './endpoints/chat/rooms/invitations/ignore.contract.js';
import { chatRoomsInvitationsInboxContract } from './endpoints/chat/rooms/invitations/inbox.contract.js';
import { chatRoomsInvitationsOutboxContract } from './endpoints/chat/rooms/invitations/outbox.contract.js';
import { chatHistoryContract } from './endpoints/chat/history.contract.js';
import { chatReadAllContract } from './endpoints/chat/read-all.contract.js';

export const chatApiContract = {
	chatMessagesCreateToUser: chatMessagesCreateToUserContract,
	chatMessagesCreateToRoom: chatMessagesCreateToRoomContract,
	chatMessagesDelete: chatMessagesDeleteContract,
	chatMessagesShow: chatMessagesShowContract,
	chatMessagesReact: chatMessagesReactContract,
	chatMessagesUnreact: chatMessagesUnreactContract,
	chatMessagesUserTimeline: chatMessagesUserTimelineContract,
	chatMessagesRoomTimeline: chatMessagesRoomTimelineContract,
	chatMessagesSearch: chatMessagesSearchContract,
	chatRoomsCreate: chatRoomsCreateContract,
	chatRoomsDelete: chatRoomsDeleteContract,
	chatRoomsJoin: chatRoomsJoinContract,
	chatRoomsLeave: chatRoomsLeaveContract,
	chatRoomsMute: chatRoomsMuteContract,
	chatRoomsShow: chatRoomsShowContract,
	chatRoomsOwned: chatRoomsOwnedContract,
	chatRoomsJoining: chatRoomsJoiningContract,
	chatRoomsUpdate: chatRoomsUpdateContract,
	chatRoomsMembers: chatRoomsMembersContract,
	chatRoomsInvitationsCreate: chatRoomsInvitationsCreateContract,
	chatRoomsInvitationsIgnore: chatRoomsInvitationsIgnoreContract,
	chatRoomsInvitationsInbox: chatRoomsInvitationsInboxContract,
	chatRoomsInvitationsOutbox: chatRoomsInvitationsOutboxContract,
	chatHistory: chatHistoryContract,
	chatReadAll: chatReadAllContract,
};
