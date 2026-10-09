/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Provider } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { createNotesCommandOperations } from '@features/notes/backend/commands.js';
import { createChatCommandOperations } from '@features/chat/backend/commands.js';
import { createChannelCommandOperations } from '@features/channels/backend/commands.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { ChatService, ChatMessageAccessError } from '@features/chat/backend/services/ChatService.js';
import { NoteDeleteService } from '@features/notes/backend/services/NoteDeleteService.js';
import { NoteDraftService } from '@features/notes/backend/services/NoteDraftService.js';
import { ReactionService } from '@features/notes/backend/services/ReactionService.js';
import { ChannelFollowingService } from '@features/channels/backend/services/ChannelFollowingService.js';
import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import type { MiChatRoom } from '@features/chat/backend/models/ChatRoom.js';
import type { MiChatMessage } from '@features/chat/backend/models/ChatMessage.js';
import type { MiChannel } from '@features/channels/backend/models/Channel.js';
import type { MiLocalUser, MiUser } from '@features/users/backend/models/User.js';
import type { MiNote } from '@features/notes/backend/models/Note.js';
import type { MiNoteDraft } from '@features/notes/backend/models/NoteDraft.js';
import type { UsersRepository, NoteThreadMutingsRepository, NotesRepository, PromoReadsRepository, ChannelsRepository, ChannelFavoritesRepository } from '@features/persistence/backend/repositories/models.js';

/** Ordinary application-operation factories used by the native oRPC composition root. */
export const featureTokens = {
	notesCommands: Symbol('note command operations'),
	chatCommands: Symbol('chat command operations'),
	channelCommands: Symbol('channel command operations'),
};

export const featureProviders: Provider[] = [{
	provide: featureTokens.notesCommands,
	inject: [GetterService, DI.usersRepository, NoteDeleteService, NoteDraftService, ReactionService, DI.noteThreadMutingsRepository, DI.notesRepository, DI.promoReadsRepository, IdService],
	useFactory: (getter: GetterService, users: UsersRepository, deletion: NoteDeleteService, drafts: NoteDraftService, reactions: ReactionService, threadMutings: NoteThreadMutingsRepository, notes: NotesRepository, promoReads: PromoReadsRepository, ids: IdService) => createNotesCommandOperations<MiLocalUser, MiNote, MiNoteDraft, MiUser>({
		getNote: id => getter.getNote(id),
		findUserByIdOrFail: id => users.findOneByOrFail({ id }),
		deleteNote: (author, note, quiet, deleter) => deletion.delete(author, note, quiet, deleter),
		getDraft: (actor, id) => drafts.get(actor, id),
		deleteDraft: (actor, id) => drafts.delete(actor, id),
		createReaction: (actor, note, reaction) => reactions.create(actor, note, reaction),
		deleteReaction: (actor, note) => reactions.delete(actor, note),
		threadMuteExists: (threadId, userId) => threadMutings.exists({ where: { threadId, userId } }),
		insertThreadMute: (id, threadId, userId) => threadMutings.insert({ id, threadId, userId }),
		deleteThreadMute: (threadId, userId) => threadMutings.delete({ threadId, userId }),
		findRenotesByUserAndRenote: (userId, renoteId) => notes.findBy({ userId, renoteId }),
		promoReadExists: (noteId, userId) => promoReads.exists({ where: { noteId, userId } }),
		insertPromoRead: (id, noteId, userId) => promoReads.insert({ id, noteId, userId }),
		newId: () => ids.gen(),
		createError: definition => apiError(definition),
	}),
}, {
	provide: featureTokens.chatCommands,
	inject: [ChatService],
	useFactory: (chat: ChatService) => createChatCommandOperations<MiChatRoom, MiChatMessage, MiLocalUser>({
		checkChatAvailability: (id, permission) => chat.checkChatAvailability(id, permission),
		readAllChatMessages: id => chat.readAllChatMessages(id),
		joinToRoom: (id, roomId) => chat.joinToRoom(id, roomId),
		leaveRoom: (id, roomId) => chat.leaveRoom(id, roomId),
		muteRoom: (id, roomId, mute) => chat.muteRoom(id, roomId, mute),
		ignoreRoomInvitation: (id, roomId) => chat.ignoreRoomInvitation(id, roomId),
		react: (messageId, id, reaction) => chat.react(messageId, id, reaction),
		unreact: (messageId, id, reaction) => chat.unreact(messageId, id, reaction),
		findMyMessageById: (id, messageId) => chat.findMyMessageById(id, messageId),
		deleteMessage: message => chat.deleteMessage(message),
		findRoomById: roomId => chat.findRoomById(roomId),
		hasPermissionToDeleteRoom: (id, room) => chat.hasPermissionToDeleteRoom(id, room),
		deleteRoom: (room, actor) => chat.deleteRoom(room, actor),
		isMessageAccessError: error => error instanceof ChatMessageAccessError,
		createError: definition => apiError(definition),
	}),
}, {
	provide: featureTokens.channelCommands,
	inject: [DI.channelsRepository, DI.channelFavoritesRepository, ChannelFollowingService, ChannelMutingService, IdService],
	useFactory: (channels: ChannelsRepository, favorites: ChannelFavoritesRepository, following: ChannelFollowingService, muting: ChannelMutingService, ids: IdService) => createChannelCommandOperations<MiChannel, MiLocalUser>({
		findById: id => channels.findOneBy({ id }),
		follow: (actor, channel) => following.follow(actor, channel),
		unfollow: (actor, channel) => following.unfollow(actor, channel),
		isAlreadyFollowingError: error => error instanceof IdentifiableError && error.id === '6e335e39-0203-4418-a936-b3f2dc987845',
		generateFavoriteId: () => ids.gen(),
		insertFavorite: values => favorites.insert(values),
		deleteFavorite: (userId, channelId) => favorites.delete({ userId, channelId }),
		isMuted: values => muting.isMuted(values),
		mute: values => muting.mute(values),
		unmute: values => muting.unmute(values),
		now: () => Date.now(),
		createError: definition => apiError(definition),
	}),
}];
