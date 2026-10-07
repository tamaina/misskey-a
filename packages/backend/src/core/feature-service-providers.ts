/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InjectionToken, Provider, Type } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { createAnnouncementServices } from '../../../features/announcements/backend/services.js';
import { AnnouncementEntityService } from '../../../features/announcements/backend/serializers/AnnouncementEntityService.js';
import { AnnouncementService } from '../../../features/announcements/backend/services/AnnouncementService.js';
import { createCollectionServices } from '../../../features/collections/backend/services.js';
import { ClipEntityService } from '../../../features/collections/backend/serializers/ClipEntityService.js';
import { NoteFavoriteEntityService } from '../../../features/collections/backend/serializers/NoteFavoriteEntityService.js';
import { ClipService } from '../../../features/collections/backend/services/ClipService.js';
import { createGalleryServices } from '../../../features/gallery/backend/services.js';
import { GalleryPostEntityService } from '../../../features/gallery/backend/serializers/GalleryPostEntityService.js';
import { GalleryLikeEntityService } from '../../../features/gallery/backend/serializers/GalleryLikeEntityService.js';
import { createPageServices } from '../../../features/pages/backend/services.js';
import { PageEntityService } from '../../../features/pages/backend/serializers/PageEntityService.js';
import { PageLikeEntityService } from '../../../features/pages/backend/serializers/PageLikeEntityService.js';
import { PageService } from '../../../features/pages/backend/services/PageService.js';
import { createPlayServices } from '../../../features/play/backend/services.js';
import { FlashEntityService } from '../../../features/play/backend/serializers/FlashEntityService.js';
import { FlashLikeEntityService } from '../../../features/play/backend/serializers/FlashLikeEntityService.js';
import { FlashService } from '../../../features/play/backend/services/FlashService.js';
import { IdService } from '../../../features/runtime/backend/services/IdService.js';
import { GlobalEventService } from '../../../features/runtime/backend/services/GlobalEventService.js';
import { ModerationLogService } from '../../../features/moderation/backend/services/ModerationLogService.js';
import { UserEntityService } from '../../../features/users/backend/serializers/UserEntityService.js';
import { NoteEntityService } from '../../../features/notes/backend/serializers/NoteEntityService.js';
import { RoleService } from '../../../features/roles/backend/services/RoleService.js';
import { DriveFileEntityService } from '../../../features/drive/backend/serializers/DriveFileEntityService.js';
import { QueryService } from './QueryService.js';

import { createAuthServices } from '../../../features/auth/backend/services.js';
import { AppEntityService } from '../../../features/auth/backend/serializers/AppEntityService.js';
import { AuthSessionEntityService } from '../../../features/auth/backend/serializers/AuthSessionEntityService.js';
import { InviteCodeEntityService } from '../../../features/auth/backend/serializers/InviteCodeEntityService.js';
import { SigninEntityService } from '../../../features/auth/backend/serializers/SigninEntityService.js';
import { createChannelServices } from '../../../features/channels/backend/services.js';
import { ChannelEntityService } from '../../../features/channels/backend/serializers/ChannelEntityService.js';
import { createChatServices } from '../../../features/chat/backend/services.js';
import { ChatEntityService } from '../../../features/chat/backend/serializers/ChatEntityService.js';
import { createDiscoveryServices } from '../../../features/discovery/backend/services.js';
import { HashtagEntityService } from '../../../features/discovery/backend/serializers/HashtagEntityService.js';
import { createDriveServices } from '../../../features/drive/backend/services.js';
import { DriveFolderEntityService } from '../../../features/drive/backend/serializers/DriveFolderEntityService.js';
import { createEmojiServices } from '../../../features/emojis/backend/services.js';
import { EmojiEntityService } from '../../../features/emojis/backend/serializers/EmojiEntityService.js';
import { createGameServices } from '../../../features/games/backend/services.js';
import { ReversiGameEntityService } from '../../../features/games/backend/serializers/ReversiGameEntityService.js';
import { createInstanceServices } from '../../../features/instance/backend/services.js';
import { InstanceEntityService } from '../../../features/instance/backend/serializers/InstanceEntityService.js';
import { MetaEntityService } from '../../../features/instance/backend/serializers/MetaEntityService.js';
import { UtilityService } from './UtilityService.js';
import { SystemAccountService } from '../../../features/users/backend/services/SystemAccountService.js';
import { createIntegrationServices } from '../../../features/integrations/backend/services.js';
import { SystemWebhookEntityService } from '../../../features/integrations/backend/serializers/SystemWebhookEntityService.js';
import { createModerationServices } from '../../../features/moderation/backend/services.js';
import { AbuseReportNotificationRecipientEntityService } from '../../../features/moderation/backend/serializers/AbuseReportNotificationRecipientEntityService.js';
import { AbuseUserReportEntityService } from '../../../features/moderation/backend/serializers/AbuseUserReportEntityService.js';
import { ModerationLogEntityService } from '../../../features/moderation/backend/serializers/ModerationLogEntityService.js';
import { createRelationshipServices } from '../../../features/relationships/backend/services.js';
import { BlockingEntityService } from '../../../features/relationships/backend/serializers/BlockingEntityService.js';
import { FollowRequestEntityService } from '../../../features/relationships/backend/serializers/FollowRequestEntityService.js';
import { FollowingEntityService } from '../../../features/relationships/backend/serializers/FollowingEntityService.js';
import { MutingEntityService } from '../../../features/relationships/backend/serializers/MutingEntityService.js';
import { RenoteMutingEntityService } from '../../../features/relationships/backend/serializers/RenoteMutingEntityService.js';
import { UserListEntityService } from '../../../features/relationships/backend/serializers/UserListEntityService.js';
import { createRoleServices } from '../../../features/roles/backend/services.js';
import { RoleEntityService } from '../../../features/roles/backend/serializers/RoleEntityService.js';
import { createTimelineServices } from '../../../features/timelines/backend/services.js';
import { AntennaEntityService } from '../../../features/timelines/backend/serializers/AntennaEntityService.js';

// Nest is a transitional host adapter. Features receive only their named ports;
// one feature factory owns construction, and class/string providers are aliases.
function provideFeatureServices<Dependencies extends object, Services extends Record<string, object>>(
	name: string,
	create: (dependencies: Dependencies) => Services,
	dependencies: { [Key in keyof Dependencies]: InjectionToken<Dependencies[Key]> },
	services: { [Key in keyof Services]: Type<Services[Key]> },
): { providers: Provider[]; exports: InjectionToken[] } {
	const featureToken = Symbol(`${name} services`);
	const dependencyNames = Object.keys(dependencies) as (keyof Dependencies)[];
	const serviceNames = Object.keys(services) as (keyof Services & string)[];
	const providers: Provider[] = [{
		provide: featureToken,
		inject: dependencyNames.map(key => dependencies[key]),
		useFactory: (...values: unknown[]) => {
			const ports = {} as Dependencies;
			for (const [index, key] of dependencyNames.entries()) {
				ports[key] = values[index] as Dependencies[typeof key];
			}
			return create(ports);
		},
	}, ...serviceNames.flatMap((key): Provider[] => [{
		provide: services[key],
		inject: [featureToken],
		useFactory: (feature: Services) => feature[key],
	}, {
		provide: key,
		useExisting: services[key],
	}])];

	return { providers, exports: serviceNames.flatMap(key => [services[key], key]) };
}

const announcements = provideFeatureServices('announcements', createAnnouncementServices, {
	announcementsRepository: DI.announcementsRepository,
	announcementReadsRepository: DI.announcementReadsRepository,
	idService: IdService,
	usersRepository: DI.usersRepository,
	globalEventService: GlobalEventService,
	moderationLogService: ModerationLogService,
}, { AnnouncementEntityService, AnnouncementService });

const collections = provideFeatureServices('collections', createCollectionServices, {
	clipsRepository: DI.clipsRepository,
	clipNotesRepository: DI.clipNotesRepository,
	clipFavoritesRepository: DI.clipFavoritesRepository,
	userEntityService: UserEntityService,
	idService: IdService,
	noteFavoritesRepository: DI.noteFavoritesRepository,
	noteEntityService: NoteEntityService,
	notesRepository: DI.notesRepository,
	roleService: RoleService,
}, { ClipEntityService, NoteFavoriteEntityService, ClipService });

const gallery = provideFeatureServices('gallery', createGalleryServices, {
	galleryPostsRepository: DI.galleryPostsRepository,
	galleryLikesRepository: DI.galleryLikesRepository,
	userEntityService: UserEntityService,
	driveFileEntityService: DriveFileEntityService,
	idService: IdService,
}, { GalleryPostEntityService, GalleryLikeEntityService });

const pages = provideFeatureServices('pages', createPageServices, {
	pagesRepository: DI.pagesRepository,
	pageLikesRepository: DI.pageLikesRepository,
	driveFilesRepository: DI.driveFilesRepository,
	userEntityService: UserEntityService,
	driveFileEntityService: DriveFileEntityService,
	idService: IdService,
	db: DI.db,
	notesRepository: DI.notesRepository,
	usersRepository: DI.usersRepository,
	roleService: RoleService,
	moderationLogService: ModerationLogService,
}, { PageEntityService, PageLikeEntityService, PageService });

const play = provideFeatureServices('play', createPlayServices, {
	flashsRepository: DI.flashsRepository,
	flashLikesRepository: DI.flashLikesRepository,
	userEntityService: UserEntityService,
	idService: IdService,
	queryService: QueryService,
}, { FlashEntityService, FlashLikeEntityService, FlashService });

const auth = provideFeatureServices('auth', createAuthServices, {
	appsRepository: DI.appsRepository,
	accessTokensRepository: DI.accessTokensRepository,
	authSessionsRepository: DI.authSessionsRepository,
	registrationTicketsRepository: DI.registrationTicketsRepository,
	userEntityService: UserEntityService,
	idService: IdService,
}, { AppEntityService, AuthSessionEntityService, InviteCodeEntityService, SigninEntityService });

const channels = provideFeatureServices('channels', createChannelServices, {
	channelsRepository: DI.channelsRepository,
	channelFollowingsRepository: DI.channelFollowingsRepository,
	channelFavoritesRepository: DI.channelFavoritesRepository,
	channelMutingRepository: DI.channelMutingRepository,
	notesRepository: DI.notesRepository,
	driveFilesRepository: DI.driveFilesRepository,
	noteEntityService: NoteEntityService,
	driveFileEntityService: DriveFileEntityService,
	idService: IdService,
}, { ChannelEntityService });

const chat = provideFeatureServices('chat', createChatServices, {
	chatMessagesRepository: DI.chatMessagesRepository,
	chatRoomsRepository: DI.chatRoomsRepository,
	chatRoomInvitationsRepository: DI.chatRoomInvitationsRepository,
	chatRoomMembershipsRepository: DI.chatRoomMembershipsRepository,
	userEntityService: UserEntityService,
	driveFileEntityService: DriveFileEntityService,
	idService: IdService,
}, { ChatEntityService });

const discovery = provideFeatureServices('discovery', createDiscoveryServices, {}, { HashtagEntityService });

const drive = provideFeatureServices('drive', createDriveServices, {
	driveFoldersRepository: DI.driveFoldersRepository,
	driveFilesRepository: DI.driveFilesRepository,
	idService: IdService,
}, { DriveFolderEntityService });

const emojis = provideFeatureServices('emojis', createEmojiServices, {
	emojisRepository: DI.emojisRepository,
	rolesRepository: DI.rolesRepository,
}, { EmojiEntityService });

const games = provideFeatureServices('games', createGameServices, {
	reversiGamesRepository: DI.reversiGamesRepository,
	userEntityService: UserEntityService,
	idService: IdService,
}, { ReversiGameEntityService });

const instance = provideFeatureServices('instance', createInstanceServices, {
	meta: DI.meta,
	roleService: RoleService,
	utilityService: UtilityService,
	config: DI.config,
	adsRepository: DI.adsRepository,
	systemAccountService: SystemAccountService,
}, { InstanceEntityService, MetaEntityService });

const integrations = provideFeatureServices('integrations', createIntegrationServices, {
	systemWebhooksRepository: DI.systemWebhooksRepository,
}, { SystemWebhookEntityService });

const moderation = provideFeatureServices('moderation', createModerationServices, {
	abuseReportNotificationRecipientRepository: DI.abuseReportNotificationRecipientRepository,
	userEntityService: UserEntityService,
	systemWebhookEntityService: SystemWebhookEntityService,
	abuseUserReportsRepository: DI.abuseUserReportsRepository,
	idService: IdService,
	moderationLogsRepository: DI.moderationLogsRepository,
}, { AbuseReportNotificationRecipientEntityService, AbuseUserReportEntityService, ModerationLogEntityService });

const relationships = provideFeatureServices('relationships', createRelationshipServices, {
	blockingsRepository: DI.blockingsRepository,
	userEntityService: UserEntityService,
	idService: IdService,
	followRequestsRepository: DI.followRequestsRepository,
	followingsRepository: DI.followingsRepository,
	mutingsRepository: DI.mutingsRepository,
	renoteMutingsRepository: DI.renoteMutingsRepository,
	userListsRepository: DI.userListsRepository,
	userListMembershipsRepository: DI.userListMembershipsRepository,
}, { BlockingEntityService, FollowRequestEntityService, FollowingEntityService, MutingEntityService, RenoteMutingEntityService, UserListEntityService });

const roles = provideFeatureServices('roles', createRoleServices, {
	rolesRepository: DI.rolesRepository,
	roleAssignmentsRepository: DI.roleAssignmentsRepository,
	idService: IdService,
}, { RoleEntityService });

const timelines = provideFeatureServices('timelines', createTimelineServices, {
	antennasRepository: DI.antennasRepository,
	idService: IdService,
}, { AntennaEntityService });

// Selective composition roots (including tests) reuse the same typed wiring.
export const featureServiceGroups = { announcements, collections, gallery, pages, play, auth, channels, chat, discovery, drive, emojis, games, instance, integrations, moderation, relationships, roles, timelines };
const features = Object.values(featureServiceGroups);

export const featureServiceProviders: Provider[] = features.flatMap(feature => feature.providers);
// The legacy FlashService string alias was private; its class token is exported.
export const featureServiceExports = features.flatMap(feature => feature.exports).filter(token => token !== 'FlashService');
