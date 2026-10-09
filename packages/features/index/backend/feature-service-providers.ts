/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { authSecurityServices, authServices } from '@features/auth/backend/services.js';
import { integrationServices } from '@features/integrations/backend/services.js';
import { channelServices } from '@features/channels/backend/services.js';
import { timelineServices } from '@features/timelines/backend/services.js';
import { gameServices } from '@features/games/backend/services.js';
import { driveServices } from '@features/drive/backend/services.js';
import { relationshipServices } from '@features/relationships/backend/services.js';
import { discoveryServices, rankingServices, userSearchServices } from '@features/discovery/backend/services.js';
import { announcementServices } from '@features/announcements/backend/services.js';
import { instanceServices } from '@features/instance/backend/services.js';
import { chatServices } from '@features/chat/backend/services.js';
import { playServices } from '@features/play/backend/services.js';
import { moderationLoggingServices, moderationServices } from '@features/moderation/backend/services.js';
import { collectionServices } from '@features/collections/backend/services.js';
import { roleServices } from '@features/roles/backend/services.js';
import { emojiServices } from '@features/emojis/backend/services.js';
import { galleryServices } from '@features/collections/backend/services/gallery.js';
import { pageProviders, pageExports } from '@features/pages/backend/services.js';
import { mediaServices } from '@features/drive/backend/services/media.js';
import { markupServices } from '@features/markup/backend/services.js';
import { preferencesServices } from '@features/preferences/backend/services.js';
import { ports } from '@features/index/backend/service-ports.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { DriveFileEntityService } from '@features/drive/backend/serializers/DriveFileEntityService.js';
import { SystemAccountService } from '@features/users/backend/services/SystemAccountService.js';
import { SystemWebhookEntityService } from '@features/integrations/backend/serializers/SystemWebhookEntityService.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import { LoggerService } from '@features/runtime/backend/services/LoggerService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { UtilityService } from '@features/federation/backend/services/UtilityService.js';
import { bindLegacyService, toNestProviders } from './feature-service-provider-types.js';

const legacyServiceBindings = [
	bindLegacyService(ports.httpRequestService, HttpRequestService),
	bindLegacyService(ports.loggerService, LoggerService),
	bindLegacyService(ports.idService, IdService),
	bindLegacyService(ports.globalEventService, GlobalEventService),
	bindLegacyService(ports.moderationLogService, ModerationLogService),
	bindLegacyService(ports.userEntityService, UserEntityService),
	bindLegacyService(ports.noteEntityService, NoteEntityService),
	bindLegacyService(ports.roleService, RoleService),
	bindLegacyService(ports.driveFileEntityService, DriveFileEntityService),
	bindLegacyService(ports.queryService, QueryService),
	bindLegacyService(ports.utilityService, UtilityService),
	bindLegacyService(ports.systemAccountService, SystemAccountService),
	bindLegacyService(ports.systemWebhookEntityService, SystemWebhookEntityService),
];

export const featureServiceGroups = {
	driveMedia: toNestProviders('driveMedia', mediaServices, legacyServiceBindings),
	markup: toNestProviders('markup', markupServices, legacyServiceBindings),
	preferences: toNestProviders('preferences', preferencesServices, legacyServiceBindings),
	auth: toNestProviders('auth', authServices, legacyServiceBindings),
	authSecurity: toNestProviders('authSecurity', authSecurityServices, legacyServiceBindings),
	integrations: toNestProviders('integrations', integrationServices, legacyServiceBindings),
	channels: toNestProviders('channels', channelServices, legacyServiceBindings),
	timelines: toNestProviders('timelines', timelineServices, legacyServiceBindings),
	games: toNestProviders('games', gameServices, legacyServiceBindings),
	drive: toNestProviders('drive', driveServices, legacyServiceBindings),
	relationships: toNestProviders('relationships', relationshipServices, legacyServiceBindings),
	discovery: toNestProviders('discovery', discoveryServices, legacyServiceBindings),
	ranking: toNestProviders('ranking', rankingServices, legacyServiceBindings),
	userSearch: toNestProviders('userSearch', userSearchServices, legacyServiceBindings),
	announcements: toNestProviders('announcements', announcementServices, legacyServiceBindings),
	instance: toNestProviders('instance', instanceServices, legacyServiceBindings),
	chat: toNestProviders('chat', chatServices, legacyServiceBindings),
	play: toNestProviders('play', playServices, legacyServiceBindings),
	moderation: toNestProviders('moderation', moderationServices, legacyServiceBindings),
	moderationLogging: toNestProviders('moderationLogging', moderationLoggingServices, legacyServiceBindings),
	collections: toNestProviders('collections', collectionServices, legacyServiceBindings),
	roles: toNestProviders('roles', roleServices, legacyServiceBindings),
	emojis: toNestProviders('emojis', emojiServices, legacyServiceBindings),
	collectionGallery: toNestProviders('collectionGallery', galleryServices, legacyServiceBindings),
	pages: {
		providers: pageProviders,
		exports: pageExports,
	},
};
const features = Object.values(featureServiceGroups);

export const featureServiceProviders = features.flatMap(feature => feature.providers);
export const featureServiceExports = features.flatMap(feature => feature.exports).filter(token => token !== 'FlashService');
