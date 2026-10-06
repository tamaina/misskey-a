/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from 'node:os';
import {
	createChatCommands,
	createCollectionCommands,
	createEmojiAdministration,
	createNotifications,
	createOperations,
	createPortability,
	createInstance,
	createStatistics,
	createAvatarDecorations,
	createEmojis,
} from '@features/index/backend';
import type { FeatureApis } from '@features/index/backend';
import { ChatService, ChatMessageAccessError } from '@/core/ChatService.js';
import { ClipService } from '@/core/ClipService.js';
import { CustomEmojiService } from '@/core/CustomEmojiService.js';
import { NotificationService } from '@/core/NotificationService.js';
import type { MiChatRoom } from '@/models/ChatRoom.js';
import type { MiChatMessage } from '@/models/ChatMessage.js';
import type { MiLocalUser } from '@/models/User.js';
import { ApiError } from './error.js';
import { QueueService } from '@/core/QueueService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { MoreThan, IsNull } from 'typeorm';
import { USER_ONLINE_THRESHOLD } from '@/const.js';
import { EmojiEntityService } from '@/core/entities/EmojiEntityService.js';
import { AvatarDecorationService } from '@/core/AvatarDecorationService.js';
import { RoleService } from '@/core/RoleService.js';
import NotesChart from '@/core/chart/charts/notes.js';
import UsersChart from '@/core/chart/charts/users.js';
import { DI } from '@/di-symbols.js';
import type { MiMeta } from '@/models/Meta.js';
import type { UsersRepository, NoteReactionsRepository, InstancesRepository, EmojisRepository } from '@/models/_.js';
import type { Provider } from '@nestjs/common';

// Transitional composition boundary: Nest resolves a feature, not each handler.
// The feature itself receives narrow dependencies and has no container access.
export type ApiFeatures = FeatureApis<MiChatRoom, MiChatMessage, MiLocalUser>;
export const featureTokens = {
	chatCommands: Symbol('chat command API feature'),
	collectionCommands: Symbol('collection command API feature'),
	emojiAdministration: Symbol('emoji administration API feature'),
	notifications: Symbol('notifications API feature'),
	operations: Symbol('operations API feature'),
	portability: Symbol('portability API feature'),
	instance: Symbol('instance API feature'),
	statistics: Symbol('statistics API feature'),
	avatarDecorations: Symbol('avatar decorations API feature'),
	emojis: Symbol('emojis API feature'),
} satisfies Record<keyof ApiFeatures, symbol>;
export const featureProviders: Provider[] = [{
	provide: featureTokens.chatCommands,
	inject: [ChatService],
	useFactory: (chat: ChatService) => createChatCommands<MiChatRoom, MiChatMessage, MiLocalUser>({
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
		createError: definition => new ApiError(definition),
	}),
}, {
	provide: featureTokens.collectionCommands,
	inject: [ClipService],
	useFactory: (clips: ClipService) => createCollectionCommands({
		delete: (actor, clipId) => clips.delete(actor, clipId),
		addNote: (actor, clipId, noteId) => clips.addNote(actor, clipId, noteId),
		removeNote: (actor, clipId, noteId) => clips.removeNote(actor, clipId, noteId),
		classifyError: error => {
			if (error instanceof ClipService.NoSuchClipError) return 'noSuchClip';
			if (error instanceof ClipService.NoSuchNoteError) return 'noSuchNote';
			if (error instanceof ClipService.AlreadyAddedError) return 'alreadyAdded';
			if (error instanceof ClipService.TooManyClipNotesError) return 'tooManyClipNotes';
			return undefined;
		},
		createError: definition => new ApiError(definition),
	}),
}, {
	provide: featureTokens.emojiAdministration,
	inject: [CustomEmojiService],
	useFactory: (emojis: CustomEmojiService) => createEmojiAdministration({
		setCategoryBulk: (ids, category) => emojis.setCategoryBulk(ids, category),
		setLicenseBulk: (ids, license) => emojis.setLicenseBulk(ids, license),
		setAliasesBulk: (ids, aliases) => emojis.setAliasesBulk(ids, aliases),
		addAliasesBulk: (ids, aliases) => emojis.addAliasesBulk(ids, aliases),
		removeAliasesBulk: (ids, aliases) => emojis.removeAliasesBulk(ids, aliases),
	}),
}, {
	provide: featureTokens.notifications,
	inject: [NotificationService],
	useFactory: (notifications: NotificationService) => createNotifications({
		createAppNotification: (id, data) => notifications.createNotification(id, 'app', data),
		createTestNotification: id => notifications.createNotification(id, 'test', {}),
		flushAllNotifications: id => notifications.flushAllNotifications(id),
		readAllNotification: (id, forCurrentUser) => notifications.readAllNotification(id, forCurrentUser),
	}),
}, {
	provide: featureTokens.operations,
	inject: [QueueService, ModerationLogService],
	useFactory: (queue: QueueService, audit: ModerationLogService) => createOperations({
		queuePause: name => queue.queuePause(name),
		queueResume: name => queue.queueResume(name),
		queueClear: (name, state) => queue.queueClear(name, state),
		queuePromoteJobs: name => queue.queuePromoteJobs(name),
		queueRetryJob: (name, jobId) => queue.queueRetryJob(name, jobId),
		queueRemoveJob: (name, jobId) => queue.queueRemoveJob(name, jobId),
		log: (actor, action) => audit.log(actor, action),
	}),
}, {
	provide: featureTokens.portability,
	inject: [QueueService],
	useFactory: (queue: QueueService) => createPortability({
		createExportAntennasJob: actor => queue.createExportAntennasJob(actor),
		createExportBlockingJob: actor => queue.createExportBlockingJob(actor),
		createExportClipsJob: actor => queue.createExportClipsJob(actor),
		createExportFavoritesJob: actor => queue.createExportFavoritesJob(actor),
		createExportFollowingJob: (actor, excludeMuting, excludeInactive) => queue.createExportFollowingJob(actor, excludeMuting, excludeInactive),
		createExportMuteJob: actor => queue.createExportMuteJob(actor),
		createExportNotesJob: actor => queue.createExportNotesJob(actor),
		createExportUserListsJob: actor => queue.createExportUserListsJob(actor),
	}),
}, {
	provide: featureTokens.instance,
	inject: [DI.meta, DI.usersRepository],
	useFactory: (settings: MiMeta, usersRepository: UsersRepository) => createInstance({
		serverInfo: {
			enabled: () => settings.enableServerMachineStats,
			read: async () => {
				const si = await import('systeminformation');
				const memStats = await si.mem();
				const fsStats = await si.fsSize();
				return {
					machine: os.hostname(),
					cpu: { model: os.cpus()[0].model, cores: os.cpus().length },
					mem: { total: memStats.total },
					fs: { total: fsStats[0].size, used: fsStats[0].used },
				};
			},
		},
		getOnlineUsersCount: {
			thresholdMs: USER_ONLINE_THRESHOLD,
			countSince: cutoff => usersRepository.countBy({ lastActiveDate: MoreThan(cutoff) }),
		},
		readEndpoints: async () => {
			const { default: endpoints } = await import('./endpoints.js');
			return endpoints.map(endpoint => {
				const properties = Object.fromEntries(Object.entries(endpoint.params.properties ?? {}).map(([name, property]) => {
					const projected: { type?: string } = {};
					if (property.type !== undefined) projected.type = property.type;
					return [name, projected];
				}));
				return { name: endpoint.name, properties };
			});
		},
	}),
}, {
	provide: featureTokens.statistics,
	inject: [NotesChart, UsersChart, DI.noteReactionsRepository, DI.instancesRepository],
	useFactory: (notesChart: NotesChart, usersChart: UsersChart, reactions: NoteReactionsRepository, instances: InstancesRepository) => createStatistics({
		readNotes: async () => {
			const chart = await notesChart.getChart('hour', 1, null);
			return { local: chart.local.total[0], remote: chart.remote.total[0] };
		},
		readUsers: async () => {
			const chart = await usersChart.getChart('hour', 1, null);
			return { local: chart.local.total[0], remote: chart.remote.total[0] };
		},
		countReactions: () => reactions.count({ cache: 3600000 }),
		countInstances: () => instances.count({ cache: 3600000 }),
	}),
}, {
	provide: featureTokens.avatarDecorations,
	inject: [AvatarDecorationService, RoleService],
	useFactory: (decorations: AvatarDecorationService, roles: RoleService) => createAvatarDecorations({
		readDecorations: () => decorations.getAll(true),
		readRoles: () => roles.getRoles(),
	}),
}, {
	provide: featureTokens.emojis,
	inject: [DI.emojisRepository, EmojiEntityService],
	useFactory: (repository: EmojisRepository, entities: EmojiEntityService) => createEmojis({
		listLocal: async () => entities.packSimpleMany(await repository.find({
			where: { host: IsNull() },
			order: { category: 'ASC', name: 'ASC' },
		})),
		findLocal: async name => entities.packDetailed(await repository.findOneOrFail({
			where: { name, host: IsNull() },
		})),
	}),
}];
