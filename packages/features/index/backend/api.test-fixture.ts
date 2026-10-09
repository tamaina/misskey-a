/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { mockDeep } from 'vitest-mock-extended';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import type { MiDriveFile } from '../../drive/backend/models/DriveFile.js';
import { createApiRouter, type ApiRouterFeatures } from './api.router.js';
import { createRolesRouter } from '../../roles/backend/api.router.js';
import { createModerationRouter } from '../../moderation/backend/api.router.js';
import { createAuthRouter } from '../../auth/backend/api.router.js';
import { createPortabilityRouter } from '../../portability/backend/api.router.js';
import { createDriveManagementRouter } from '../../drive/backend/management.router.js';
import { createIntegrationsRouter } from '../../integrations/backend/router.js';
import { createOperationsRouter } from '../../operations/backend/router.js';
import { createFederationRouter } from '../../federation/backend/router.js';
import { createGamesRouter } from '../../games/backend/router.js';
import { createPlayRouter } from '../../play/backend/router.js';
import { createPagesRouter } from '../../pages/backend/router.js';
import { createChannelsRouter } from '../../channels/backend/api.router.js';
import { createChatRouter } from '../../chat/backend/api.router.js';
import { createInstanceRouter } from '../../instance/backend/api.router.js';
import { createStatisticsRouter } from '../../statistics/backend/router.js';
import { createDiscoveryRouter } from '../../discovery/backend/endpoints/discovery.js';
import { createAnnouncementsRouter } from '../../announcements/backend/api.router.js';
import { createAvatarDecorationsRouter } from '../../avatar-decorations/backend/api.implementation.js';
import { createPreferencesRouter } from '../../preferences/backend/router.js';
import { createEmojisRouter } from '../../emojis/backend/api.router.js';
import { createNotificationsRouter } from '../../notifications/backend/router.js';
import { createNotesRouter } from '../../notes/backend/api.router.js';
import { createUsersRouter } from '../../users/backend/api.router.js';
import { createTimelinesRouter } from '../../timelines/backend/router.js';
import { createNoteSearchRouter } from '../../note-search/backend/router.js';
import { createRelationshipsRouter } from '../../relationships/backend/endpoints/relationships.js';
import { createCollectionsRouter } from '../../collections/backend/api.router.js';
import { createDriveRouter } from '../../drive/backend/api.router.js';
export function createApiTestFeatures(): ApiRouterFeatures {
	return {
		roles: createRolesRouter<MiLocalUser>(mockDeep<Parameters<typeof createRolesRouter<MiLocalUser>>[0]>()),
		moderation: createModerationRouter<MiLocalUser>(mockDeep<Parameters<typeof createModerationRouter<MiLocalUser>>[0]>()),
		auth: createAuthRouter(mockDeep<Parameters<typeof createAuthRouter>[0]>()),
		portability: createPortabilityRouter<MiLocalUser, MiDriveFile>(mockDeep<Parameters<typeof createPortabilityRouter<MiLocalUser, MiDriveFile>>[0]>()),
		driveManagement: createDriveManagementRouter(mockDeep<Parameters<typeof createDriveManagementRouter>[0]>()),
		integrations: createIntegrationsRouter(mockDeep<Parameters<typeof createIntegrationsRouter>[0]>()),
		operations: createOperationsRouter<MiLocalUser>(mockDeep<Parameters<typeof createOperationsRouter<MiLocalUser>>[0]>()),
		federation: createFederationRouter<MiLocalUser>(mockDeep<Parameters<typeof createFederationRouter<MiLocalUser>>[0]>()),
		games: createGamesRouter(mockDeep<Parameters<typeof createGamesRouter>[0]>()),
		play: createPlayRouter(mockDeep<Parameters<typeof createPlayRouter>[0]>()),
		pages: createPagesRouter(mockDeep<Parameters<typeof createPagesRouter>[0]>()),
		channels: createChannelsRouter<MiLocalUser>(mockDeep<Parameters<typeof createChannelsRouter<MiLocalUser>>[0]>()),
		chat: createChatRouter(mockDeep<Parameters<typeof createChatRouter>[0]>()),
		instance: createInstanceRouter<MiLocalUser>(mockDeep<Parameters<typeof createInstanceRouter<MiLocalUser>>[0]>()),
		statistics: createStatisticsRouter<MiLocalUser>(mockDeep<Parameters<typeof createStatisticsRouter<MiLocalUser>>[0]>()),
		discovery: createDiscoveryRouter<MiLocalUser>(mockDeep<Parameters<typeof createDiscoveryRouter<MiLocalUser>>[0]>()),
		announcements: createAnnouncementsRouter<MiLocalUser>(mockDeep<Parameters<typeof createAnnouncementsRouter<MiLocalUser>>[0]>()),
		avatarDecorations: createAvatarDecorationsRouter<MiLocalUser>(mockDeep<Parameters<typeof createAvatarDecorationsRouter<MiLocalUser>>[0]>()),
		preferences: createPreferencesRouter<MiLocalUser>(mockDeep<Parameters<typeof createPreferencesRouter<MiLocalUser>>[0]>()),
		emojis: createEmojisRouter<MiLocalUser>(mockDeep<Parameters<typeof createEmojisRouter<MiLocalUser>>[0]>()),
		notifications: createNotificationsRouter(mockDeep<Parameters<typeof createNotificationsRouter>[0]>()),
		notes: createNotesRouter(mockDeep<Parameters<typeof createNotesRouter>[0]>()),
		users: createUsersRouter(mockDeep<Parameters<typeof createUsersRouter>[0]>()),
		timelines: createTimelinesRouter<MiLocalUser>(mockDeep<Parameters<typeof createTimelinesRouter<MiLocalUser>>[0]>()),
		noteSearch: createNoteSearchRouter<MiLocalUser>(mockDeep<Parameters<typeof createNoteSearchRouter<MiLocalUser>>[0]>()),
		relationships: createRelationshipsRouter<MiLocalUser>(mockDeep<Parameters<typeof createRelationshipsRouter<MiLocalUser>>[0]>()),
		collections: createCollectionsRouter<MiLocalUser>(mockDeep<Parameters<typeof createCollectionsRouter<MiLocalUser>>[0]>()),
		drive: createDriveRouter<MiLocalUser, MiDriveFile>(mockDeep<Parameters<typeof createDriveRouter<MiLocalUser, MiDriveFile>>[0]>()),
	};
}
export function createApiTestRouter(overrides: Partial<ApiRouterFeatures> = {}) {
	return createApiRouter({ ...createApiTestFeatures(), ...overrides });
}
