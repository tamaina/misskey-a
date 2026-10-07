/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createProcedureClient, implement } from '@orpc/server';
import type { JsonSchema } from '@valibot/to-json-schema';
import type { ApiErrorDefinition } from '@features/api/contract/index.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import { chatContract, chatErrors, chatInputs } from '../contract/index.js';

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
	createError(definition: ApiErrorDefinition): Error;
	isMessageAccessError(error: unknown): boolean;
}

function requireActor<Actor extends { id: string }>(context: ChatCommandsContext<Actor> | null | undefined): Actor {
	if (context == null || context.actor == null || typeof context.actor.id !== 'string' || context.actor.id.length === 0) {
		throw new Error('A trusted chat actor is required');
	}

	return context.actor;
}

/** Build the nine write/read chat commands without exposing backend services to the feature. */
export function createChatCommands<Room, Message, Actor extends { id: string }>(deps: ChatCommandsDependencies<Room, Message, Actor>) {
	const clientContext = (context: ChatCommandsContext<Actor>) => context;

	const readAll = createProcedureClient(implement(chatContract['chat/read-all'])
		.$context<ChatCommandsContext<Actor>>()
		.handler(async ({ context }) => {
			const actor = requireActor(context);
			await deps.checkChatAvailability(actor.id, 'read');
			await deps.readAllChatMessages(actor.id);
		}), { context: clientContext });

	const join = createProcedureClient(implement(chatContract['chat/rooms/join'])
		.$context<ChatCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireActor(context);
			await deps.checkChatAvailability(actor.id, 'write');
			await deps.joinToRoom(actor.id, input.roomId);
		}), { context: clientContext });

	const leave = createProcedureClient(implement(chatContract['chat/rooms/leave'])
		.$context<ChatCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireActor(context);
			await deps.checkChatAvailability(actor.id, 'write');
			await deps.leaveRoom(actor.id, input.roomId);
		}), { context: clientContext });

	const mute = createProcedureClient(implement(chatContract['chat/rooms/mute'])
		.$context<ChatCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireActor(context);
			await deps.checkChatAvailability(actor.id, 'write');
			await deps.muteRoom(actor.id, input.roomId, input.mute);
		}), { context: clientContext });

	const deleteRoom = createProcedureClient(implement(chatContract['chat/rooms/delete'])
		.$context<ChatCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireActor(context);
			await deps.checkChatAvailability(actor.id, 'write');

			const room = await deps.findRoomById(input.roomId);
			if (room == null || !await deps.hasPermissionToDeleteRoom(actor.id, room)) {
				throw deps.createError(chatErrors['chat/rooms/delete'].noSuchRoom);
			}

			await deps.deleteRoom(room, actor);
		}), { context: clientContext });

	const ignoreInvitation = createProcedureClient(implement(chatContract['chat/rooms/invitations/ignore'])
		.$context<ChatCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireActor(context);
			await deps.checkChatAvailability(actor.id, 'write');
			await deps.ignoreRoomInvitation(actor.id, input.roomId);
		}), { context: clientContext });

	const react = createProcedureClient(implement(chatContract['chat/messages/react'])
		.$context<ChatCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireActor(context);
			await deps.checkChatAvailability(actor.id, 'write');

			try {
				await deps.react(input.messageId, actor.id, input.reaction);
			} catch (error) {
				if (deps.isMessageAccessError(error)) {
					throw deps.createError(chatErrors['chat/messages/react'].noSuchMessage);
				}
				throw error;
			}
		}), { context: clientContext });

	const unreact = createProcedureClient(implement(chatContract['chat/messages/unreact'])
		.$context<ChatCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireActor(context);
			await deps.checkChatAvailability(actor.id, 'write');

			try {
				await deps.unreact(input.messageId, actor.id, input.reaction);
			} catch (error) {
				if (deps.isMessageAccessError(error)) {
					throw deps.createError(chatErrors['chat/messages/unreact'].noSuchMessage);
				}
				throw error;
			}
		}), { context: clientContext });

	const deleteMessage = createProcedureClient(implement(chatContract['chat/messages/delete'])
		.$context<ChatCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireActor(context);
			await deps.checkChatAvailability(actor.id, 'write');

			const message = await deps.findMyMessageById(actor.id, input.messageId);
			if (message == null) throw deps.createError(chatErrors['chat/messages/delete'].noSuchMessage);
			await deps.deleteMessage(message);
		}), { context: clientContext });

	return {
		'chat/read-all': readAll,
		'chat/rooms/join': join,
		'chat/rooms/leave': leave,
		'chat/rooms/mute': mute,
		'chat/rooms/delete': deleteRoom,
		'chat/rooms/invitations/ignore': ignoreInvitation,
		'chat/messages/react': react,
		'chat/messages/unreact': unreact,
		'chat/messages/delete': deleteMessage,
	};
}

export type ChatCommandsFeature<Room, Message, Actor extends { id: string }> = ReturnType<typeof createChatCommands<Room, Message, Actor>>;

export const legacyChatSchemas: Record<keyof typeof chatInputs, { input: JsonSchema }> = {
	'chat/read-all': { input: toLegacyJsonSchema(chatInputs['chat/read-all']) },
	'chat/rooms/join': { input: toLegacyJsonSchema(chatInputs['chat/rooms/join']) },
	'chat/rooms/leave': { input: toLegacyJsonSchema(chatInputs['chat/rooms/leave']) },
	'chat/rooms/mute': { input: toLegacyJsonSchema(chatInputs['chat/rooms/mute']) },
	'chat/rooms/delete': { input: toLegacyJsonSchema(chatInputs['chat/rooms/delete']) },
	'chat/rooms/invitations/ignore': { input: toLegacyJsonSchema(chatInputs['chat/rooms/invitations/ignore']) },
	'chat/messages/react': { input: toLegacyJsonSchema(chatInputs['chat/messages/react']) },
	'chat/messages/unreact': { input: toLegacyJsonSchema(chatInputs['chat/messages/unreact']) },
	'chat/messages/delete': { input: toLegacyJsonSchema(chatInputs['chat/messages/delete']) },
};
