/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { createInstanceRouter } from '../../instance/backend/api.router.js';
import { createNotesRouter } from '../../notes/backend/api.router.js';
import { createDriveRouter } from '../../drive/backend/api.router.js';
import { createStatisticsRouter } from '../../statistics/backend/router.js';
import { createDiscoveryRouter } from '../../discovery/backend/endpoints/discovery.js';
import { createAnnouncementsRouter } from '../../announcements/backend/api.router.js';
import { createAvatarDecorationsRouter } from '../../avatar-decorations/backend/api.router.js';
import { createEmojisRouter } from '../../emojis/backend/api.router.js';
import { createNotificationsRouter } from '../../notifications/backend/router.js';
import { createPreferencesRouter } from '../../preferences/backend/router.js';
import { normalizeError } from '../../api/backend/transport/orpc-error.js';

import { createUsersRouter } from '../../users/backend/api.router.js';

import { createTimelinesRouter } from '../../timelines/backend/router.js';

import { createNoteSearchRouter } from '../../note-search/backend/router.js';

import { createRelationshipsRouter } from '../../relationships/backend/endpoints/relationships.js';

import { createCollectionsRouter } from '../../collections/backend/api.router.js';
import { pilotContract } from './api.contract.js';
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { ApiExecutionContext } from './api.context.js';

import { createChatRouter } from '../../chat/backend/api.router.js';

import { createChannelsRouter } from '../../channels/backend/api.router.js';

import { createPagesRouter } from '../../pages/backend/router.js';

import { createPlayRouter } from '../../play/backend/router.js';

import { createGamesRouter } from '../../games/backend/router.js';

import { createFederationRouter } from '../../federation/backend/router.js';

import { createOperationsRouter } from '../../operations/backend/router.js';

import { createIntegrationsRouter } from '../../integrations/backend/router.js';

import { createTestProcedure } from '../../api/backend/endpoints/test.js';

import { createDriveManagementRouter } from '../../drive/backend/management.router.js';

import { createPortabilityRouter } from '../../portability/backend/api.router.js';

import { createAuthRouter } from '../../auth/backend/api.router.js';

import { createModerationRouter } from '../../moderation/backend/api.router.js';

import { createRolesRouter } from '../../roles/backend/api.router.js';

import { createClearBrowserCacheProcedure, createClearBrowserCacheGetProcedure } from '../../api/backend/endpoints/clear-browser-cache.js';

export function createApiRouter<Actor extends ApiActor>() {
	const api = implement(pilotContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiExecutionContext<Actor>>()
		.use(async ({ context, next }) => {
			try { return await next(); } catch (error) { throw context.mapError ? context.mapError(error) : normalizeError(error); }
		});
	return api.router({
		clearBrowserCache: createClearBrowserCacheProcedure<Actor>(),
		clearBrowserCacheGet: createClearBrowserCacheGetProcedure<Actor>(),
		roles: createRolesRouter<Actor>(),
		moderation: createModerationRouter<Actor>(),
		auth: createAuthRouter<Actor>(),
		portability: createPortabilityRouter<Actor>(),
		driveManagement: createDriveManagementRouter<Actor>(),
		test: createTestProcedure<Actor>(),
		integrations: createIntegrationsRouter<Actor>(),
		operations: createOperationsRouter<Actor>(),
		federation: createFederationRouter<Actor>(),
		games: createGamesRouter<Actor>(),
		play: createPlayRouter<Actor>(),
		pages: createPagesRouter<Actor>(),
		channels: createChannelsRouter<Actor>(),
		chat: createChatRouter<Actor>(),
		instance: createInstanceRouter<Actor>(),
		statistics: createStatisticsRouter<Actor>(),
		discovery: createDiscoveryRouter<Actor>(),
		announcements: createAnnouncementsRouter<Actor>(),
		avatarDecorations: createAvatarDecorationsRouter<Actor>(),
		preferences: createPreferencesRouter<Actor>(),
		emojis: createEmojisRouter<Actor>(),
		notifications: createNotificationsRouter<Actor>(),
		notes: createNotesRouter<Actor>(),
		users: createUsersRouter<Actor>(),
		timelines: createTimelinesRouter<Actor>(),
		noteSearch: createNoteSearchRouter<Actor>(),
		relationships: createRelationshipsRouter<Actor>(),
		collections: createCollectionsRouter<Actor>(),
		drive: createDriveRouter<Actor>(),
	});
}
