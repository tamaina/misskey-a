/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getPilotEndpointDescriptors } from '@features/api/backend/transport/openapi/pilot-spec.js';
import * as os from 'node:os';
import {
	createModerationCommands,
	createNotesCommands,
	createRelationshipCommands,
	createPortabilityImportCommands,
	createAvatarDecorationCommands,
	createAnnouncementCommands,
	createWebhookCommands,
	createListCommands,
	createChannelCommands,
	createClipFavoriteCommands,
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
import { ChatService, ChatMessageAccessError } from '@features/chat/backend/services/ChatService.js';
import { ClipService } from '@features/collections/backend/services/ClipService.js';
import { CustomEmojiService } from '@features/emojis/backend/services/CustomEmojiService.js';
import { NotificationService } from '@features/notifications/backend/services/NotificationService.js';
import type { MiChatRoom } from '@features/chat/backend/models/ChatRoom.js';
import type { MiChatMessage } from '@features/chat/backend/models/ChatMessage.js';
import type { MiAnnouncement } from '@features/announcements/backend/models/Announcement.js';
import type { MiWebhook } from '@features/integrations/backend/models/Webhook.js';
import type { MiUserList } from '@features/relationships/backend/models/UserList.js';
import type { MiUserListFavorite } from '@features/relationships/backend/models/UserListFavorite.js';
import type { MiUser } from '@features/users/backend/models/User.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { AnnouncementService } from '@features/announcements/backend/services/AnnouncementService.js';
import { UserListService } from '@features/relationships/backend/services/UserListService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { ChannelFollowingService } from '@features/channels/backend/services/ChannelFollowingService.js';
import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
import type { MiChannel } from '@features/channels/backend/models/Channel.js';
import type { MiClip } from '@features/collections/backend/models/Clip.js';
import type { MiClipFavorite } from '@features/collections/backend/models/ClipFavorite.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { ApiError } from '@features/api/backend/transport/error.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { MoreThan, IsNull } from 'typeorm';
import { USER_ONLINE_THRESHOLD } from '@features/users/backend/presence-constants.js';
import { EmojiEntityService } from '@features/emojis/backend/serializers/EmojiEntityService.js';
import { AvatarDecorationService } from '@features/avatar-decorations/backend/services/AvatarDecorationService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { NotesChart } from '@features/statistics/backend/charts/notes.js';
import { UsersChart } from '@features/statistics/backend/charts/users.js';
import { DI } from '@/di-symbols.js';
import type { MiMeta } from '@features/instance/backend/models/Meta.js';
import type { UsersRepository, NoteReactionsRepository, InstancesRepository, EmojisRepository, AnnouncementsRepository, WebhooksRepository, UserListsRepository, UserListFavoritesRepository, UserListMembershipsRepository, BlockingsRepository, ChannelsRepository, ChannelFavoritesRepository, ClipsRepository, ClipFavoritesRepository } from '@features/persistence/backend/repositories/models.js';
import type { Provider } from '@nestjs/common';

import { UserSuspendService } from '@features/moderation/backend/services/UserSuspendService.js';
import { AbuseReportService } from '@features/moderation/backend/services/AbuseReportService.js';
import { AbuseReportNotificationService } from '@features/moderation/backend/services/AbuseReportNotificationService.js';
import { NoteDeleteService } from '@features/notes/backend/services/NoteDeleteService.js';
import { NoteDraftService } from '@features/notes/backend/services/NoteDraftService.js';
import { ReactionService } from '@features/notes/backend/services/ReactionService.js';
import { UserFollowingService } from '@features/relationships/backend/services/UserFollowingService.js';
import { UserMutingService } from '@features/relationships/backend/services/UserMutingService.js';
import { UserRenoteMutingService } from '@features/relationships/backend/services/UserRenoteMutingService.js';
import { DownloadService } from '@features/runtime/backend/services/DownloadService.js';
import { AccountMoveService } from '@features/users/backend/services/AccountMoveService.js';
import type { MiUserProfile, MiAbuseUserReport, MiNote, MiNoteDraft, MiMuting, MiRenoteMuting, MiDriveFile, UserProfilesRepository, AbuseUserReportsRepository, NoteThreadMutingsRepository, NotesRepository, PromoReadsRepository, MutingsRepository, RenoteMutingsRepository, DriveFilesRepository, AntennasRepository } from '@features/persistence/backend/repositories/models.js';

// Transitional composition boundary: Nest resolves a feature, not each handler.
// The feature itself receives narrow dependencies and has no container access.
type ResolvedUser = Awaited<ReturnType<GetterService['getUser']>>;

export type ApiFeatures = FeatureApis<{
	relationshipUser: ResolvedUser;
	moderationUser: MiUser;
	moderationProfile: MiUserProfile;
	moderationReport: MiAbuseUserReport;
	note: MiNote;
	noteDraft: MiNoteDraft;
	noteAuthor: MiUser;
	muting: MiMuting;
	renoteMuting: MiRenoteMuting;
	driveFile: MiDriveFile;
	channel: MiChannel;
	clip: MiClip;
	clipFavorite: MiClipFavorite;
	room: MiChatRoom;
	message: MiChatMessage;
	actor: MiLocalUser;
	announcement: MiAnnouncement;
	webhook: MiWebhook;
	list: MiUserList;
	user: MiUser;
	favorite: MiUserListFavorite;
}>;
export const featureTokens = {
	moderationCommands: Symbol('moderation command API feature'),
	notesCommands: Symbol('note command API feature'),
	relationshipCommands: Symbol('relationship command API feature'),
	portabilityImportCommands: Symbol('portability import command API feature'),
	channelCommands: Symbol('channel command API feature'),
	clipFavoriteCommands: Symbol('clip favorite command API feature'),
	listCommands: Symbol('list command API feature'),
	avatarDecorationCommands: Symbol('avatar decoration command API feature'),
	announcementCommands: Symbol('announcement command API feature'),
	webhookCommands: Symbol('webhook command API feature'),
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

function hasErrorId(error: unknown, id: string): boolean {
	return typeof error === 'object' && error !== null && 'id' in error && error.id === id;
}

export const featureProviders: Provider[] = [{
	provide: featureTokens.moderationCommands,
	inject: [DI.usersRepository, DI.userProfilesRepository, DI.abuseUserReportsRepository, UserSuspendService, RoleService, ModerationLogService, AbuseReportService, AbuseReportNotificationService],
	useFactory: (users: UsersRepository, profiles: UserProfilesRepository, reports: AbuseUserReportsRepository, suspension: UserSuspendService, roles: RoleService, logs: ModerationLogService, abuse: AbuseReportService, recipients: AbuseReportNotificationService) => createModerationCommands<MiUser, MiUserProfile, MiAbuseUserReport, MiLocalUser>({
		findUserById: id => users.findOneBy({ id }),
		isModerator: user => roles.isModerator(user),
		suspend: (user, actor) => suspension.suspend(user, actor),
		unsuspend: (user, actor) => suspension.unsuspend(user, actor),
		updateUser: (id, values) => users.update(id, values),
		findUserProfileByUserIdOrFail: userId => profiles.findOneByOrFail({ userId }),
		updateUserProfile: (userId, values) => profiles.update({ userId }, values),
		logUserAvatarUnset: (actor, values) => logs.log(actor, 'unsetUserAvatar', values),
		logUserBannerUnset: (actor, values) => logs.log(actor, 'unsetUserBanner', values),
		logUserNoteUpdate: (actor, values) => logs.log(actor, 'updateUserNote', values),
		findAbuseReportById: id => reports.findOneBy({ id }),
		forwardAbuseReport: (id, actor) => abuse.forward(id, actor),
		resolveAbuseReports: (values, actor) => abuse.resolve(values, actor),
		updateAbuseReport: (id, values, actor) => abuse.update(id, values, actor),
		deleteAbuseReportNotificationRecipient: (id, actor) => recipients.deleteRecipient(id, actor),
		createError: definition => new ApiError(definition),
	}),
}, {
	provide: featureTokens.notesCommands,
	inject: [GetterService, RoleService, DI.usersRepository, NoteDeleteService, NoteDraftService, ReactionService, DI.noteThreadMutingsRepository, DI.notesRepository, DI.promoReadsRepository, IdService],
	useFactory: (getter: GetterService, roles: RoleService, users: UsersRepository, deletion: NoteDeleteService, drafts: NoteDraftService, reactions: ReactionService, threadMutings: NoteThreadMutingsRepository, notes: NotesRepository, promoReads: PromoReadsRepository, ids: IdService) => createNotesCommands<MiLocalUser, MiNote, MiNoteDraft, MiUser>({
		getNote: id => getter.getNote(id),
		isModerator: actor => roles.isModerator(actor),
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
		createError: definition => new ApiError(definition),
	}),
}, {
	provide: featureTokens.relationshipCommands,
	inject: [GetterService, UserFollowingService, DI.mutingsRepository, UserMutingService, DI.renoteMutingsRepository, UserRenoteMutingService],
	useFactory: (getter: GetterService, following: UserFollowingService, mutings: MutingsRepository, muting: UserMutingService, renoteMutings: RenoteMutingsRepository, renoteMuting: UserRenoteMutingService) => createRelationshipCommands<ResolvedUser, MiLocalUser, MiMuting, MiRenoteMuting>({
		getUser: id => getter.getUser(id),
		isMissingUserError: error => hasErrorId(error, '15348ddd-432d-49c2-8a5a-8069753becff'),
		acceptFollowRequest: (actor, follower) => following.acceptFollowRequest(actor, follower),
		rejectFollowRequest: (actor, follower) => following.rejectFollowRequest(actor, follower),
		isMissingFollowRequestError: error => hasErrorId(error, '8884c2dd-5795-4ac9-b27e-6a01d38190f9'),
		findMuting: (muterId, muteeId) => mutings.findOneBy({ muterId, muteeId }),
		unmute: rows => muting.unmute(rows),
		isRenoteMuting: (muterId, muteeId) => renoteMutings.exists({ where: { muterId, muteeId } }),
		muteRenotes: (actor, target) => renoteMuting.mute(actor, target),
		findRenoteMuting: (muterId, muteeId) => renoteMutings.findOneBy({ muterId, muteeId }),
		unmuteRenotes: rows => renoteMuting.unmute(rows),
		createError: definition => new ApiError(definition),
	}),
}, {
	provide: featureTokens.portabilityImportCommands,
	inject: [DI.usersRepository, DI.driveFilesRepository, DI.antennasRepository, RoleService, DownloadService, AccountMoveService, QueueService],
	useFactory: (users: UsersRepository, files: DriveFilesRepository, antennas: AntennasRepository, roles: RoleService, downloads: DownloadService, moves: AccountMoveService, queue: QueueService) => createPortabilityImportCommands<MiLocalUser, MiDriveFile>({
		userExists: id => users.exists({ where: { id } }),
		findOwnedFile: (id, userId) => files.findOneBy({ id, userId }),
		countAntennas: userId => antennas.countBy({ userId }),
		getAntennaLimit: async userId => (await roles.getUserPolicies(userId)).antennaLimit,
		downloadTextFile: url => downloads.downloadTextFile(url),
		isMovingDuringGracePeriod: async actor => (await moves.validateAlsoKnownAs(actor, (_old, src) => !!src.movedAt && src.movedAt.getTime() + 1000 * 60 * 60 * 2 > Date.now(), true)) !== null,
		createImportAntennasJob: (actor, data) => queue.createImportAntennasJob(actor, data),
		createImportBlockingJob: (actor, id) => queue.createImportBlockingJob(actor, id),
		createImportFollowingJob: (actor, id, withReplies) => queue.createImportFollowingJob(actor, id, withReplies),
		createImportMutingJob: (actor, id) => queue.createImportMutingJob(actor, id),
		createImportUserListsJob: (actor, id) => queue.createImportUserListsJob(actor, id),
		createError: definition => new ApiError(definition),
	}),
},
{
	provide: featureTokens.channelCommands,
	inject: [DI.channelsRepository, DI.channelFavoritesRepository, ChannelFollowingService, ChannelMutingService, IdService],
	useFactory: (channels: ChannelsRepository, favorites: ChannelFavoritesRepository, following: ChannelFollowingService, muting: ChannelMutingService, ids: IdService) => createChannelCommands<MiChannel, MiLocalUser>({
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
		createError: definition => new ApiError(definition),
	}),
}, {
	provide: featureTokens.clipFavoriteCommands,
	inject: [DI.clipsRepository, DI.clipFavoritesRepository, IdService],
	useFactory: (clips: ClipsRepository, favorites: ClipFavoritesRepository, ids: IdService) => createClipFavoriteCommands<MiClip, MiClipFavorite>({
		findClipById: id => clips.findOneBy({ id }),
		hasFavorite: (clipId, userId) => favorites.exists({ where: { clipId, userId } }),
		generateFavoriteId: () => ids.gen(),
		insertFavorite: values => favorites.insert(values),
		findFavorite: (clipId, userId) => favorites.findOneBy({ clipId, userId }),
		deleteFavorite: id => favorites.delete(id),
		createError: definition => new ApiError(definition),
	}),
}, {
	provide: featureTokens.listCommands,
	inject: [DI.userListsRepository, DI.userListFavoritesRepository, DI.userListMembershipsRepository, DI.blockingsRepository, GetterService, UserListService, IdService],
	useFactory: (lists: UserListsRepository, favorites: UserListFavoritesRepository, memberships: UserListMembershipsRepository, blockings: BlockingsRepository, getter: GetterService, service: UserListService, ids: IdService) => createListCommands<MiUserList, MiUser, MiLocalUser, MiUserListFavorite>({
		findOwnedList: (id, userId) => lists.findOneBy({ id, userId }),
		deleteList: id => lists.delete(id),
		findPublicList: id => lists.exists({ where: { id, isPublic: true } }),
		hasFavorite: (userId, userListId) => favorites.exists({ where: { userId, userListId } }),
		generateFavoriteId: () => ids.gen(),
		insertFavorite: values => favorites.insert(values),
		findFavorite: (userListId, userId) => favorites.findOneBy({ userListId, userId }),
		deleteFavorite: id => favorites.delete({ id }),
		getUser: id => getter.getUser(id),
		isMissingUserError: error => (error as { id?: unknown }).id === '15348ddd-432d-49c2-8a5a-8069753becff',
		removeMember: (user, list) => service.removeMember(user, list),
		hasReverseBlock: (blockerId, blockeeId) => blockings.exists({ where: { blockerId, blockeeId } }),
		hasMembership: (userListId, userId) => memberships.exists({ where: { userListId, userId } }),
		addMember: (user, list, actor) => service.addMember(user, list, actor),
		isTooManyUsersError: error => error instanceof UserListService.TooManyUsersError,
		updateMembership: (user, list, values) => service.updateMembership(user, list, values),
		createError: definition => new ApiError(definition),
	}),
}, {
	provide: featureTokens.avatarDecorationCommands,
	inject: [AvatarDecorationService],
	useFactory: (decorations: AvatarDecorationService) => createAvatarDecorationCommands<MiLocalUser>({
		update: (id, values, actor) => decorations.update(id, values, actor),
		delete: (id, actor) => decorations.delete(id, actor),
	}),
}, {
	provide: featureTokens.announcementCommands,
	inject: [DI.announcementsRepository, AnnouncementService],
	useFactory: (repository: AnnouncementsRepository, announcements: AnnouncementService) => createAnnouncementCommands<MiAnnouncement, MiLocalUser>({
		findById: id => repository.findOneBy({ id }),
		update: (announcement, values, actor) => announcements.update(announcement, values, actor),
		delete: (announcement, actor) => announcements.delete(announcement, actor),
		read: (actor, id) => announcements.read(actor, id),
		now: () => new Date(),
		createError: definition => new ApiError(definition),
	}),
}, {
	provide: featureTokens.webhookCommands,
	inject: [DI.webhooksRepository, GlobalEventService],
	useFactory: (repository: WebhooksRepository, events: GlobalEventService) => createWebhookCommands<MiWebhook>({
		findOwnedById: (id, userId) => repository.findOneBy({ id, userId }),
		update: (id, values) => repository.update(id, values),
		findByIdOrFail: id => repository.findOneByOrFail({ id }),
		delete: id => repository.delete(id),
		publishUpdated: webhook => events.publishInternalEvent('webhookUpdated', webhook),
		publishDeleted: webhook => events.publishInternalEvent('webhookDeleted', webhook),
		createError: definition => new ApiError(definition),
	}),
}, {
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
			const { endpoints } = await import('./endpoints.js');
			const legacy = endpoints.map(endpoint => {
				const properties = Object.fromEntries(Object.entries(endpoint.params.properties ?? {}).map(([name, property]) => {
					const projected: { type?: string } = {};
					if (property.type !== undefined) projected.type = property.type;
					return [name, projected];
				}));
				return { name: endpoint.name, properties };
			});
			return [...legacy, ...await getPilotEndpointDescriptors()].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
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
