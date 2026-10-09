/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import type { ChatCommandOperations } from './commands.js';
import type { MiChatRoom } from './models/ChatRoom.js';
import type { MiChatMessage } from './models/ChatMessage.js';
import { chatMessagesCreateToUserInput, chatMessagesCreateToUserOutput } from './endpoints/chat/messages/create-to-user.contract.js';
import { chatMessagesCreateToRoomInput, chatMessagesCreateToRoomOutput } from './endpoints/chat/messages/create-to-room.contract.js';
import { chatMessagesDeleteInput, chatMessagesDeleteOutput } from './endpoints/chat/messages/delete.contract.js';
import { chatMessagesShowInput, chatMessagesShowOutput } from './endpoints/chat/messages/show.contract.js';
import { chatMessagesReactInput, chatMessagesReactOutput } from './endpoints/chat/messages/react.contract.js';
import { chatMessagesUnreactInput, chatMessagesUnreactOutput } from './endpoints/chat/messages/unreact.contract.js';
import { chatMessagesUserTimelineInput, chatMessagesUserTimelineOutput } from './endpoints/chat/messages/user-timeline.contract.js';
import { chatMessagesRoomTimelineInput, chatMessagesRoomTimelineOutput } from './endpoints/chat/messages/room-timeline.contract.js';
import { chatMessagesSearchInput, chatMessagesSearchOutput } from './endpoints/chat/messages/search.contract.js';
import { chatRoomsCreateInput, chatRoomsCreateOutput } from './endpoints/chat/rooms/create.contract.js';
import { chatRoomsDeleteInput, chatRoomsDeleteOutput } from './endpoints/chat/rooms/delete.contract.js';
import { chatRoomsJoinInput, chatRoomsJoinOutput } from './endpoints/chat/rooms/join.contract.js';
import { chatRoomsLeaveInput, chatRoomsLeaveOutput } from './endpoints/chat/rooms/leave.contract.js';
import { chatRoomsMuteInput, chatRoomsMuteOutput } from './endpoints/chat/rooms/mute.contract.js';
import { chatRoomsShowInput, chatRoomsShowOutput } from './endpoints/chat/rooms/show.contract.js';
import { chatRoomsOwnedInput, chatRoomsOwnedOutput } from './endpoints/chat/rooms/owned.contract.js';
import { chatRoomsJoiningInput, chatRoomsJoiningOutput } from './endpoints/chat/rooms/joining.contract.js';
import { chatRoomsUpdateInput, chatRoomsUpdateOutput } from './endpoints/chat/rooms/update.contract.js';
import { chatRoomsMembersInput, chatRoomsMembersOutput } from './endpoints/chat/rooms/members.contract.js';
import { chatRoomsInvitationsCreateInput, chatRoomsInvitationsCreateOutput } from './endpoints/chat/rooms/invitations/create.contract.js';
import { chatRoomsInvitationsIgnoreInput, chatRoomsInvitationsIgnoreOutput } from './endpoints/chat/rooms/invitations/ignore.contract.js';
import { chatRoomsInvitationsInboxInput, chatRoomsInvitationsInboxOutput } from './endpoints/chat/rooms/invitations/inbox.contract.js';
import { chatRoomsInvitationsOutboxInput, chatRoomsInvitationsOutboxOutput } from './endpoints/chat/rooms/invitations/outbox.contract.js';
import { chatHistoryInput, chatHistoryOutput } from './endpoints/chat/history.contract.js';
import { chatReadAllInput, chatReadAllOutput } from './endpoints/chat/read-all.contract.js';
import { ChatMessagesCreateToUserOperation } from './endpoints/chat/messages/create-to-user.js';
import { ChatMessagesCreateToRoomOperation } from './endpoints/chat/messages/create-to-room.js';
import { ChatMessagesShowOperation } from './endpoints/chat/messages/show.js';
import { ChatMessagesUserTimelineOperation } from './endpoints/chat/messages/user-timeline.js';
import { ChatMessagesRoomTimelineOperation } from './endpoints/chat/messages/room-timeline.js';
import { ChatMessagesSearchOperation } from './endpoints/chat/messages/search.js';
import { ChatRoomsCreateOperation } from './endpoints/chat/rooms/create.js';
import { ChatRoomsShowOperation } from './endpoints/chat/rooms/show.js';
import { ChatRoomsOwnedOperation } from './endpoints/chat/rooms/owned.js';
import { ChatRoomsJoiningOperation } from './endpoints/chat/rooms/joining.js';
import { ChatRoomsUpdateOperation } from './endpoints/chat/rooms/update.js';
import { ChatRoomsMembersOperation } from './endpoints/chat/rooms/members.js';
import { ChatRoomsInvitationsCreateOperation } from './endpoints/chat/rooms/invitations/create.js';
import { ChatRoomsInvitationsInboxOperation } from './endpoints/chat/rooms/invitations/inbox.js';
import { ChatRoomsInvitationsOutboxOperation } from './endpoints/chat/rooms/invitations/outbox.js';
import { ChatHistoryOperation } from './endpoints/chat/history.js';

export interface ChatOperations<Actor extends ApiActor> {
	chatMessagesCreateToUser(input: v.InferOutput<typeof chatMessagesCreateToUserInput>, actor: Actor): Promise<v.InferOutput<typeof chatMessagesCreateToUserOutput>>;
	chatMessagesCreateToRoom(input: v.InferOutput<typeof chatMessagesCreateToRoomInput>, actor: Actor): Promise<v.InferOutput<typeof chatMessagesCreateToRoomOutput>>;
	chatMessagesDelete(input: v.InferOutput<typeof chatMessagesDeleteInput>, actor: Actor): Promise<v.InferOutput<typeof chatMessagesDeleteOutput>>;
	chatMessagesShow(input: v.InferOutput<typeof chatMessagesShowInput>, actor: Actor): Promise<v.InferOutput<typeof chatMessagesShowOutput>>;
	chatMessagesReact(input: v.InferOutput<typeof chatMessagesReactInput>, actor: Actor): Promise<v.InferOutput<typeof chatMessagesReactOutput>>;
	chatMessagesUnreact(input: v.InferOutput<typeof chatMessagesUnreactInput>, actor: Actor): Promise<v.InferOutput<typeof chatMessagesUnreactOutput>>;
	chatMessagesUserTimeline(input: v.InferOutput<typeof chatMessagesUserTimelineInput>, actor: Actor): Promise<v.InferOutput<typeof chatMessagesUserTimelineOutput>>;
	chatMessagesRoomTimeline(input: v.InferOutput<typeof chatMessagesRoomTimelineInput>, actor: Actor): Promise<v.InferOutput<typeof chatMessagesRoomTimelineOutput>>;
	chatMessagesSearch(input: v.InferOutput<typeof chatMessagesSearchInput>, actor: Actor): Promise<v.InferOutput<typeof chatMessagesSearchOutput>>;
	chatRoomsCreate(input: v.InferOutput<typeof chatRoomsCreateInput>, actor: Actor): Promise<v.InferOutput<typeof chatRoomsCreateOutput>>;
	chatRoomsDelete(input: v.InferOutput<typeof chatRoomsDeleteInput>, actor: Actor): Promise<v.InferOutput<typeof chatRoomsDeleteOutput>>;
	chatRoomsJoin(input: v.InferOutput<typeof chatRoomsJoinInput>, actor: Actor): Promise<v.InferOutput<typeof chatRoomsJoinOutput>>;
	chatRoomsLeave(input: v.InferOutput<typeof chatRoomsLeaveInput>, actor: Actor): Promise<v.InferOutput<typeof chatRoomsLeaveOutput>>;
	chatRoomsMute(input: v.InferOutput<typeof chatRoomsMuteInput>, actor: Actor): Promise<v.InferOutput<typeof chatRoomsMuteOutput>>;
	chatRoomsShow(input: v.InferOutput<typeof chatRoomsShowInput>, actor: Actor): Promise<v.InferOutput<typeof chatRoomsShowOutput>>;
	chatRoomsOwned(input: v.InferOutput<typeof chatRoomsOwnedInput>, actor: Actor): Promise<v.InferOutput<typeof chatRoomsOwnedOutput>>;
	chatRoomsJoining(input: v.InferOutput<typeof chatRoomsJoiningInput>, actor: Actor): Promise<v.InferOutput<typeof chatRoomsJoiningOutput>>;
	chatRoomsUpdate(input: v.InferOutput<typeof chatRoomsUpdateInput>, actor: Actor): Promise<v.InferOutput<typeof chatRoomsUpdateOutput>>;
	chatRoomsMembers(input: v.InferOutput<typeof chatRoomsMembersInput>, actor: Actor): Promise<v.InferOutput<typeof chatRoomsMembersOutput>>;
	chatRoomsInvitationsCreate(input: v.InferOutput<typeof chatRoomsInvitationsCreateInput>, actor: Actor): Promise<v.InferOutput<typeof chatRoomsInvitationsCreateOutput>>;
	chatRoomsInvitationsIgnore(input: v.InferOutput<typeof chatRoomsInvitationsIgnoreInput>, actor: Actor): Promise<v.InferOutput<typeof chatRoomsInvitationsIgnoreOutput>>;
	chatRoomsInvitationsInbox(input: v.InferOutput<typeof chatRoomsInvitationsInboxInput>, actor: Actor): Promise<v.InferOutput<typeof chatRoomsInvitationsInboxOutput>>;
	chatRoomsInvitationsOutbox(input: v.InferOutput<typeof chatRoomsInvitationsOutboxInput>, actor: Actor): Promise<v.InferOutput<typeof chatRoomsInvitationsOutboxOutput>>;
	chatHistory(input: v.InferOutput<typeof chatHistoryInput>, actor: Actor): Promise<v.InferOutput<typeof chatHistoryOutput>>;
	chatReadAll(input: v.InferOutput<typeof chatReadAllInput>, actor: Actor): Promise<v.InferOutput<typeof chatReadAllOutput>>;
}

export type ChatApiContext<Actor extends ApiActor> = ApiContext<Actor> & { operations: { chat: ChatOperations<Actor> } };

export const chatOperationProviders = [
	ChatMessagesCreateToUserOperation,
	ChatMessagesCreateToRoomOperation,
	ChatMessagesShowOperation,
	ChatMessagesUserTimelineOperation,
	ChatMessagesRoomTimelineOperation,
	ChatMessagesSearchOperation,
	ChatRoomsCreateOperation,
	ChatRoomsShowOperation,
	ChatRoomsOwnedOperation,
	ChatRoomsJoiningOperation,
	ChatRoomsUpdateOperation,
	ChatRoomsMembersOperation,
	ChatRoomsInvitationsCreateOperation,
	ChatRoomsInvitationsInboxOperation,
	ChatRoomsInvitationsOutboxOperation,
	ChatHistoryOperation,
];

export interface ChatOperationDependencies {
	chatMessagesCreateToUser: Pick<ChatMessagesCreateToUserOperation, 'execute'>;
	chatMessagesCreateToRoom: Pick<ChatMessagesCreateToRoomOperation, 'execute'>;
	chatMessagesShow: Pick<ChatMessagesShowOperation, 'execute'>;
	chatMessagesUserTimeline: Pick<ChatMessagesUserTimelineOperation, 'execute'>;
	chatMessagesRoomTimeline: Pick<ChatMessagesRoomTimelineOperation, 'execute'>;
	chatMessagesSearch: Pick<ChatMessagesSearchOperation, 'execute'>;
	chatRoomsCreate: Pick<ChatRoomsCreateOperation, 'execute'>;
	chatRoomsShow: Pick<ChatRoomsShowOperation, 'execute'>;
	chatRoomsOwned: Pick<ChatRoomsOwnedOperation, 'execute'>;
	chatRoomsJoining: Pick<ChatRoomsJoiningOperation, 'execute'>;
	chatRoomsUpdate: Pick<ChatRoomsUpdateOperation, 'execute'>;
	chatRoomsMembers: Pick<ChatRoomsMembersOperation, 'execute'>;
	chatRoomsInvitationsCreate: Pick<ChatRoomsInvitationsCreateOperation, 'execute'>;
	chatRoomsInvitationsInbox: Pick<ChatRoomsInvitationsInboxOperation, 'execute'>;
	chatRoomsInvitationsOutbox: Pick<ChatRoomsInvitationsOutboxOperation, 'execute'>;
	chatHistory: Pick<ChatHistoryOperation, 'execute'>;
	commands: ChatCommandOperations<MiChatRoom, MiChatMessage, MiLocalUser>;
}

export function createChatOperations(deps: ChatOperationDependencies): ChatOperations<MiLocalUser> {
	return {
		chatMessagesCreateToUser: (input, actor) => deps.chatMessagesCreateToUser.execute(input, actor),
		chatMessagesCreateToRoom: (input, actor) => deps.chatMessagesCreateToRoom.execute(input, actor),
		chatMessagesDelete: (input, actor) => deps.commands.chatMessagesDelete(input, actor),
		chatMessagesShow: (input, actor) => deps.chatMessagesShow.execute(input, actor),
		chatMessagesReact: (input, actor) => deps.commands.chatMessagesReact(input, actor),
		chatMessagesUnreact: (input, actor) => deps.commands.chatMessagesUnreact(input, actor),
		chatMessagesUserTimeline: (input, actor) => deps.chatMessagesUserTimeline.execute(input, actor),
		chatMessagesRoomTimeline: (input, actor) => deps.chatMessagesRoomTimeline.execute(input, actor),
		chatMessagesSearch: (input, actor) => deps.chatMessagesSearch.execute(input, actor),
		chatRoomsCreate: (input, actor) => deps.chatRoomsCreate.execute(input, actor),
		chatRoomsDelete: (input, actor) => deps.commands.chatRoomsDelete(input, actor),
		chatRoomsJoin: (input, actor) => deps.commands.chatRoomsJoin(input, actor),
		chatRoomsLeave: (input, actor) => deps.commands.chatRoomsLeave(input, actor),
		chatRoomsMute: (input, actor) => deps.commands.chatRoomsMute(input, actor),
		chatRoomsShow: (input, actor) => deps.chatRoomsShow.execute(input, actor),
		chatRoomsOwned: (input, actor) => deps.chatRoomsOwned.execute(input, actor),
		chatRoomsJoining: (input, actor) => deps.chatRoomsJoining.execute(input, actor),
		chatRoomsUpdate: (input, actor) => deps.chatRoomsUpdate.execute(input, actor),
		chatRoomsMembers: (input, actor) => deps.chatRoomsMembers.execute(input, actor),
		chatRoomsInvitationsCreate: (input, actor) => deps.chatRoomsInvitationsCreate.execute(input, actor),
		chatRoomsInvitationsIgnore: (input, actor) => deps.commands.chatRoomsInvitationsIgnore(input, actor),
		chatRoomsInvitationsInbox: (input, actor) => deps.chatRoomsInvitationsInbox.execute(input, actor),
		chatRoomsInvitationsOutbox: (input, actor) => deps.chatRoomsInvitationsOutbox.execute(input, actor),
		chatHistory: (input, actor) => deps.chatHistory.execute(input, actor),
		chatReadAll: (input, actor) => deps.commands.chatReadAll(input, actor),
	};
}
