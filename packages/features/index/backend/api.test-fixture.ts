/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { mockDeep } from 'vitest-mock-extended';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiDriveFile } from '@features/drive/backend/models/DriveFile.js';
import { createApiRouter, type ApiRouterFeatures } from './api.implementation.js';
import { createRolesRouter } from '@features/roles/backend/api.implementation.js';
import { createModerationRouter } from '@features/moderation/backend/api.implementation.js';
import { createAuthRouter } from '@features/auth/backend/api.implementation.js';
import { createPortabilityRouter } from '@features/portability/backend/api.implementation.js';
import { createDriveManagementRouter } from '@features/drive/backend/api.implementation.js';
import { createIntegrationsRouter } from '@features/integrations/backend/api.implementation.js';
import { createOperationsRouter } from '@features/operations/backend/api.implementation.js';
import { createFederationRouter } from '@features/federation/backend/api.implementation.js';
import { createGamesRouter } from '@features/games/backend/api.implementation.js';
import { createPlayRouter } from '@features/play/backend/api.implementation.js';
import { createPagesRouter } from '@features/pages/backend/api.implementation.js';
import { createChannelsRouter } from '@features/channels/backend/api.implementation.js';
import { createChatRouter } from '@features/chat/backend/api.implementation.js';
import { createInstanceRouter } from '@features/instance/backend/api.implementation.js';
import { createStatisticsRouter } from '@features/statistics/backend/api.implementation.js';
import { createDiscoveryRouter } from '@features/discovery/backend/endpoints/discovery.js';
import { createAnnouncementsRouter } from '@features/announcements/backend/api.implementation.js';
import { createAvatarDecorationsRouter } from '@features/avatar-decorations/backend/api.implementation.js';
import { createPreferencesRouter } from '@features/preferences/backend/api.implementation.js';
import { createEmojisRouter } from '@features/emojis/backend/api.implementation.js';
import { createNotificationsRouter } from '@features/notifications/backend/api.implementation.js';
import { createNotesRouter } from '@features/notes/backend/api.implementation.js';
import { createUsersRouter } from '@features/users/backend/api.implementation.js';
import { createTimelinesRouter } from '@features/timelines/backend/api.implementation.js';
import { createNoteSearchRouter } from '@features/note-search/backend/api.implementation.js';
import { createRelationshipsRouter } from '@features/relationships/backend/endpoints/relationships.js';
import { createCollectionsRouter } from '@features/collections/backend/api.implementation.js';
import { createDriveRouter } from '@features/drive/backend/api.implementation.js';
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
