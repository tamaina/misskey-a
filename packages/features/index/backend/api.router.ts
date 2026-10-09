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

export function createApiRouter<Actor extends ApiActor>() {
	const api = implement(pilotContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiExecutionContext<Actor>>()
		.use(async ({ context, next }) => {
			try { return await next(); } catch (error) { throw context.mapError ? context.mapError(error) : normalizeError(error); }
		});
	return api.router({
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
