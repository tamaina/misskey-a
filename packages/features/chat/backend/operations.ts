/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import type { ChatCommandOperations } from './commands.js';
import type { MiChatRoom } from './models/ChatRoom.js';
import type { MiChatMessage } from './models/ChatMessage.js';
import type { chatMessagesCreateToUserContract } from './endpoints/chat/messages/create-to-user.contract.js';
import type { chatMessagesCreateToRoomContract } from './endpoints/chat/messages/create-to-room.contract.js';
import type { chatMessagesDeleteContract } from './endpoints/chat/messages/delete.contract.js';
import type { chatMessagesShowContract } from './endpoints/chat/messages/show.contract.js';
import type { chatMessagesReactContract } from './endpoints/chat/messages/react.contract.js';
import type { chatMessagesUnreactContract } from './endpoints/chat/messages/unreact.contract.js';
import type { chatMessagesUserTimelineContract } from './endpoints/chat/messages/user-timeline.contract.js';
import type { chatMessagesRoomTimelineContract } from './endpoints/chat/messages/room-timeline.contract.js';
import type { chatMessagesSearchContract } from './endpoints/chat/messages/search.contract.js';
import type { chatRoomsCreateContract } from './endpoints/chat/rooms/create.contract.js';
import type { chatRoomsDeleteContract } from './endpoints/chat/rooms/delete.contract.js';
import type { chatRoomsJoinContract } from './endpoints/chat/rooms/join.contract.js';
import type { chatRoomsLeaveContract } from './endpoints/chat/rooms/leave.contract.js';
import type { chatRoomsMuteContract } from './endpoints/chat/rooms/mute.contract.js';
import type { chatRoomsShowContract } from './endpoints/chat/rooms/show.contract.js';
import type { chatRoomsOwnedContract } from './endpoints/chat/rooms/owned.contract.js';
import type { chatRoomsJoiningContract } from './endpoints/chat/rooms/joining.contract.js';
import type { chatRoomsUpdateContract } from './endpoints/chat/rooms/update.contract.js';
import type { chatRoomsMembersContract } from './endpoints/chat/rooms/members.contract.js';
import type { chatRoomsInvitationsCreateContract } from './endpoints/chat/rooms/invitations/create.contract.js';
import type { chatRoomsInvitationsIgnoreContract } from './endpoints/chat/rooms/invitations/ignore.contract.js';
import type { chatRoomsInvitationsInboxContract } from './endpoints/chat/rooms/invitations/inbox.contract.js';
import type { chatRoomsInvitationsOutboxContract } from './endpoints/chat/rooms/invitations/outbox.contract.js';
import type { chatHistoryContract } from './endpoints/chat/history.contract.js';
import type { chatReadAllContract } from './endpoints/chat/read-all.contract.js';
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
	chatMessagesCreateToUser(input: InferSchemaOutput<NonNullable<typeof chatMessagesCreateToUserContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesCreateToUserContract['~orpc']['outputSchema']>>>;
	chatMessagesCreateToRoom(input: InferSchemaOutput<NonNullable<typeof chatMessagesCreateToRoomContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesCreateToRoomContract['~orpc']['outputSchema']>>>;
	chatMessagesDelete(input: InferSchemaOutput<NonNullable<typeof chatMessagesDeleteContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesDeleteContract['~orpc']['outputSchema']>>>;
	chatMessagesShow(input: InferSchemaOutput<NonNullable<typeof chatMessagesShowContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesShowContract['~orpc']['outputSchema']>>>;
	chatMessagesReact(input: InferSchemaOutput<NonNullable<typeof chatMessagesReactContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesReactContract['~orpc']['outputSchema']>>>;
	chatMessagesUnreact(input: InferSchemaOutput<NonNullable<typeof chatMessagesUnreactContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesUnreactContract['~orpc']['outputSchema']>>>;
	chatMessagesUserTimeline(input: InferSchemaOutput<NonNullable<typeof chatMessagesUserTimelineContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesUserTimelineContract['~orpc']['outputSchema']>>>;
	chatMessagesRoomTimeline(input: InferSchemaOutput<NonNullable<typeof chatMessagesRoomTimelineContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesRoomTimelineContract['~orpc']['outputSchema']>>>;
	chatMessagesSearch(input: InferSchemaOutput<NonNullable<typeof chatMessagesSearchContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatMessagesSearchContract['~orpc']['outputSchema']>>>;
	chatRoomsCreate(input: InferSchemaOutput<NonNullable<typeof chatRoomsCreateContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsCreateContract['~orpc']['outputSchema']>>>;
	chatRoomsDelete(input: InferSchemaOutput<NonNullable<typeof chatRoomsDeleteContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsDeleteContract['~orpc']['outputSchema']>>>;
	chatRoomsJoin(input: InferSchemaOutput<NonNullable<typeof chatRoomsJoinContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsJoinContract['~orpc']['outputSchema']>>>;
	chatRoomsLeave(input: InferSchemaOutput<NonNullable<typeof chatRoomsLeaveContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsLeaveContract['~orpc']['outputSchema']>>>;
	chatRoomsMute(input: InferSchemaOutput<NonNullable<typeof chatRoomsMuteContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsMuteContract['~orpc']['outputSchema']>>>;
	chatRoomsShow(input: InferSchemaOutput<NonNullable<typeof chatRoomsShowContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsShowContract['~orpc']['outputSchema']>>>;
	chatRoomsOwned(input: InferSchemaOutput<NonNullable<typeof chatRoomsOwnedContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsOwnedContract['~orpc']['outputSchema']>>>;
	chatRoomsJoining(input: InferSchemaOutput<NonNullable<typeof chatRoomsJoiningContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsJoiningContract['~orpc']['outputSchema']>>>;
	chatRoomsUpdate(input: InferSchemaOutput<NonNullable<typeof chatRoomsUpdateContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsUpdateContract['~orpc']['outputSchema']>>>;
	chatRoomsMembers(input: InferSchemaOutput<NonNullable<typeof chatRoomsMembersContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsMembersContract['~orpc']['outputSchema']>>>;
	chatRoomsInvitationsCreate(input: InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsCreateContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsCreateContract['~orpc']['outputSchema']>>>;
	chatRoomsInvitationsIgnore(input: InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsIgnoreContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsIgnoreContract['~orpc']['outputSchema']>>>;
	chatRoomsInvitationsInbox(input: InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsInboxContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsInboxContract['~orpc']['outputSchema']>>>;
	chatRoomsInvitationsOutbox(input: InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsOutboxContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsOutboxContract['~orpc']['outputSchema']>>>;
	chatHistory(input: InferSchemaOutput<NonNullable<typeof chatHistoryContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatHistoryContract['~orpc']['outputSchema']>>>;
	chatReadAll(input: InferSchemaOutput<NonNullable<typeof chatReadAllContract['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<typeof chatReadAllContract['~orpc']['outputSchema']>>>;
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
