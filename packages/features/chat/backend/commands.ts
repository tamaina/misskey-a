/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { chatMessagesDeleteErrors, type chatMessagesDeleteContract } from './endpoints/chat/messages/delete.contract.js';
import { chatMessagesReactErrors, type chatMessagesReactContract } from './endpoints/chat/messages/react.contract.js';
import { chatMessagesUnreactErrors, type chatMessagesUnreactContract } from './endpoints/chat/messages/unreact.contract.js';
import { chatRoomsDeleteErrors, type chatRoomsDeleteContract } from './endpoints/chat/rooms/delete.contract.js';
import { chatRoomsJoinErrors, type chatRoomsJoinContract } from './endpoints/chat/rooms/join.contract.js';
import { chatRoomsLeaveErrors, type chatRoomsLeaveContract } from './endpoints/chat/rooms/leave.contract.js';
import { chatRoomsMuteErrors, type chatRoomsMuteContract } from './endpoints/chat/rooms/mute.contract.js';
import { chatRoomsInvitationsIgnoreErrors, type chatRoomsInvitationsIgnoreContract } from './endpoints/chat/rooms/invitations/ignore.contract.js';
import { chatReadAllErrors, type chatReadAllContract } from './endpoints/chat/read-all.contract.js';
import type { ErrorDefinition } from '../../api/backend/transport/orpc-error.js';

export interface ChatCommandsContext<Actor extends { id: string }> {
	actor: Actor;
}

/** Only the chat operations required by these command endpoints. */
export interface ChatCommandsDependencies<Room, Message, Actor extends { id: string }> {
	checkChatAvailability(userId: string, permission: 'read' | 'write'): Promise<unknown>;
	readAllChatMessages(userId: string): Promise<unknown>;
	joinToRoom(userId: string, roomId: string): Promise<unknown>;
	leaveRoom(userId: string, roomId: string): Promise<unknown>;
	muteRoom(userId: string, roomId: string, mute: boolean): Promise<unknown>;
	ignoreRoomInvitation(userId: string, roomId: string): Promise<unknown>;
	react(messageId: string, userId: string, reaction: string): Promise<unknown>;
	unreact(messageId: string, userId: string, reaction: string): Promise<unknown>;
	findMyMessageById(userId: string, messageId: string): Promise<Message | null | undefined>;
	deleteMessage(message: Message): Promise<unknown>;
	findRoomById(roomId: string): Promise<Room | null | undefined>;
	hasPermissionToDeleteRoom(userId: string, room: Room): Promise<boolean>;
	deleteRoom(room: Room, actor: Actor): Promise<unknown>;
	createError(definition: ErrorDefinition): Error;
	isMessageAccessError(error: unknown): boolean;
}

export function createChatCommandOperations<Room, Message, Actor extends { id: string }>(deps: ChatCommandsDependencies<Room, Message, Actor>) {
	return {
		async chatMessagesDelete(input: InferSchemaOutput<NonNullable<typeof chatMessagesDeleteContract['~orpc']['inputSchema']>>, actor: Actor): Promise<void> {
			await deps.checkChatAvailability(actor.id, 'write');

			const message = await deps.findMyMessageById(actor.id, input.messageId);
			if (message == null) throw deps.createError(chatMessagesDeleteErrors.noSuchMessage);
			await deps.deleteMessage(message);
		},
		async chatMessagesReact(input: InferSchemaOutput<NonNullable<typeof chatMessagesReactContract['~orpc']['inputSchema']>>, actor: Actor): Promise<void> {
			await deps.checkChatAvailability(actor.id, 'write');

			try {
				await deps.react(input.messageId, actor.id, input.reaction);
			} catch (error) {
				if (deps.isMessageAccessError(error)) {
					throw deps.createError(chatMessagesReactErrors.noSuchMessage);
				}
				throw error;
			}
		},
		async chatMessagesUnreact(input: InferSchemaOutput<NonNullable<typeof chatMessagesUnreactContract['~orpc']['inputSchema']>>, actor: Actor): Promise<void> {
			await deps.checkChatAvailability(actor.id, 'write');

			try {
				await deps.unreact(input.messageId, actor.id, input.reaction);
			} catch (error) {
				if (deps.isMessageAccessError(error)) {
					throw deps.createError(chatMessagesUnreactErrors.noSuchMessage);
				}
				throw error;
			}
		},
		async chatRoomsDelete(input: InferSchemaOutput<NonNullable<typeof chatRoomsDeleteContract['~orpc']['inputSchema']>>, actor: Actor): Promise<void> {
			await deps.checkChatAvailability(actor.id, 'write');

			const room = await deps.findRoomById(input.roomId);
			if (room == null || !await deps.hasPermissionToDeleteRoom(actor.id, room)) {
				throw deps.createError(chatRoomsDeleteErrors.noSuchRoom);
			}

			await deps.deleteRoom(room, actor);
		},
		async chatRoomsJoin(input: InferSchemaOutput<NonNullable<typeof chatRoomsJoinContract['~orpc']['inputSchema']>>, actor: Actor): Promise<void> {
			await deps.checkChatAvailability(actor.id, 'write');
			await deps.joinToRoom(actor.id, input.roomId);
		},
		async chatRoomsLeave(input: InferSchemaOutput<NonNullable<typeof chatRoomsLeaveContract['~orpc']['inputSchema']>>, actor: Actor): Promise<void> {
			await deps.checkChatAvailability(actor.id, 'write');
			await deps.leaveRoom(actor.id, input.roomId);
		},
		async chatRoomsMute(input: InferSchemaOutput<NonNullable<typeof chatRoomsMuteContract['~orpc']['inputSchema']>>, actor: Actor): Promise<void> {
			await deps.checkChatAvailability(actor.id, 'write');
			await deps.muteRoom(actor.id, input.roomId, input.mute);
		},
		async chatRoomsInvitationsIgnore(input: InferSchemaOutput<NonNullable<typeof chatRoomsInvitationsIgnoreContract['~orpc']['inputSchema']>>, actor: Actor): Promise<void> {
			await deps.checkChatAvailability(actor.id, 'write');
			await deps.ignoreRoomInvitation(actor.id, input.roomId);
		},
		async chatReadAll(input: InferSchemaOutput<NonNullable<typeof chatReadAllContract['~orpc']['inputSchema']>>, actor: Actor): Promise<void> {
			await deps.checkChatAvailability(actor.id, 'read');
			await deps.readAllChatMessages(actor.id);
		},
	};
}

export type ChatCommandOperations<Room, Message, Actor extends { id: string }> = ReturnType<typeof createChatCommandOperations<Room, Message, Actor>>;
export const createChatCommands = createChatCommandOperations;
export type ChatCommandsFeature<Room, Message, Actor extends { id: string }> = ChatCommandOperations<Room, Message, Actor>;
