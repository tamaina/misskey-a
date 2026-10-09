/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { chatMessagesDeleteInput, chatMessagesDeleteErrors } from './endpoints/chat/messages/delete.contract.js';
import { chatMessagesReactInput, chatMessagesReactErrors } from './endpoints/chat/messages/react.contract.js';
import { chatMessagesUnreactInput, chatMessagesUnreactErrors } from './endpoints/chat/messages/unreact.contract.js';
import { chatRoomsDeleteInput, chatRoomsDeleteErrors } from './endpoints/chat/rooms/delete.contract.js';
import { chatRoomsJoinInput, chatRoomsJoinErrors } from './endpoints/chat/rooms/join.contract.js';
import { chatRoomsLeaveInput, chatRoomsLeaveErrors } from './endpoints/chat/rooms/leave.contract.js';
import { chatRoomsMuteInput, chatRoomsMuteErrors } from './endpoints/chat/rooms/mute.contract.js';
import { chatRoomsInvitationsIgnoreInput, chatRoomsInvitationsIgnoreErrors } from './endpoints/chat/rooms/invitations/ignore.contract.js';
import { chatReadAllInput, chatReadAllErrors } from './endpoints/chat/read-all.contract.js';
import type { ErrorDefinition } from '../../api/backend/transport/orpc-error.js';
import type * as v from 'valibot';

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
		async chatMessagesDelete(input: v.InferOutput<typeof chatMessagesDeleteInput>, actor: Actor): Promise<void> {
			await deps.checkChatAvailability(actor.id, 'write');

			const message = await deps.findMyMessageById(actor.id, input.messageId);
			if (message == null) throw deps.createError(chatMessagesDeleteErrors.noSuchMessage);
			await deps.deleteMessage(message);
		},
		async chatMessagesReact(input: v.InferOutput<typeof chatMessagesReactInput>, actor: Actor): Promise<void> {
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
		async chatMessagesUnreact(input: v.InferOutput<typeof chatMessagesUnreactInput>, actor: Actor): Promise<void> {
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
		async chatRoomsDelete(input: v.InferOutput<typeof chatRoomsDeleteInput>, actor: Actor): Promise<void> {
			await deps.checkChatAvailability(actor.id, 'write');

			const room = await deps.findRoomById(input.roomId);
			if (room == null || !await deps.hasPermissionToDeleteRoom(actor.id, room)) {
				throw deps.createError(chatRoomsDeleteErrors.noSuchRoom);
			}

			await deps.deleteRoom(room, actor);
		},
		async chatRoomsJoin(input: v.InferOutput<typeof chatRoomsJoinInput>, actor: Actor): Promise<void> {
			await deps.checkChatAvailability(actor.id, 'write');
			await deps.joinToRoom(actor.id, input.roomId);
		},
		async chatRoomsLeave(input: v.InferOutput<typeof chatRoomsLeaveInput>, actor: Actor): Promise<void> {
			await deps.checkChatAvailability(actor.id, 'write');
			await deps.leaveRoom(actor.id, input.roomId);
		},
		async chatRoomsMute(input: v.InferOutput<typeof chatRoomsMuteInput>, actor: Actor): Promise<void> {
			await deps.checkChatAvailability(actor.id, 'write');
			await deps.muteRoom(actor.id, input.roomId, input.mute);
		},
		async chatRoomsInvitationsIgnore(input: v.InferOutput<typeof chatRoomsInvitationsIgnoreInput>, actor: Actor): Promise<void> {
			await deps.checkChatAvailability(actor.id, 'write');
			await deps.ignoreRoomInvitation(actor.id, input.roomId);
		},
		async chatReadAll(input: v.InferOutput<typeof chatReadAllInput>, actor: Actor): Promise<void> {
			await deps.checkChatAvailability(actor.id, 'read');
			await deps.readAllChatMessages(actor.id);
		},
	};
}

export type ChatCommandOperations<Room, Message, Actor extends { id: string }> = ReturnType<typeof createChatCommandOperations<Room, Message, Actor>>;
export const createChatCommands = createChatCommandOperations;
export type ChatCommandsFeature<Room, Message, Actor extends { id: string }> = ChatCommandOperations<Room, Message, Actor>;
