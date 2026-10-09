/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { pilotContract } from './api.contract.js';
import type { ApiContext } from '../../api/backend/transport/context.js';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import { normalizeError } from '../../api/backend/transport/orpc-error.js';
import { createTestProcedure } from '../../api/backend/endpoints/test.js';
import { createClearBrowserCacheProcedure, createClearBrowserCacheGetProcedure } from '../../api/backend/endpoints/clear-browser-cache.js';
import type { RolesApiProvider } from '../../roles/backend/api.provider.js';
import type { ModerationApiProvider } from '../../moderation/backend/api.provider.js';
import type { AuthApiProvider } from '../../auth/backend/api.provider.js';
import type { PortabilityApiProvider } from '../../portability/backend/api.provider.js';
import type { DriveManagementApiProvider } from '../../drive/backend/management.provider.js';
import type { IntegrationsApiProvider } from '../../integrations/backend/api.provider.js';
import type { OperationsApiProvider } from '../../operations/backend/api.provider.js';
import type { FederationApiProvider } from '../../federation/backend/api.provider.js';
import type { GamesApiProvider } from '../../games/backend/api.provider.js';
import type { PlayApiProvider } from '../../play/backend/api.provider.js';
import type { PagesApiProvider } from '../../pages/backend/api.provider.js';
import type { ChannelsApiProvider } from '../../channels/backend/api.provider.js';
import type { ChatApiProvider } from '../../chat/backend/api.provider.js';
import type { InstanceApiProvider } from '../../instance/backend/api.provider.js';
import type { StatisticsApiProvider } from '../../statistics/backend/api.provider.js';
import type { DiscoveryApiProvider } from '../../discovery/backend/api.provider.js';
import type { AnnouncementsApiProvider } from '../../announcements/backend/api.provider.js';
import type { AvatarDecorationsApiProvider } from '../../avatar-decorations/backend/api.provider.js';
import type { PreferencesApiProvider } from '../../preferences/backend/api.provider.js';
import type { EmojisApiProvider } from '../../emojis/backend/api.provider.js';
import type { NotificationsApiProvider } from '../../notifications/backend/api.provider.js';
import type { NotesApiProvider } from '../../notes/backend/api.provider.js';
import type { UsersApiProvider } from '../../users/backend/api.provider.js';
import type { TimelinesApiProvider } from '../../timelines/backend/api.provider.js';
import type { NoteSearchApiProvider } from '../../note-search/backend/api.provider.js';
import type { RelationshipsApiProvider } from '../../relationships/backend/api.provider.js';
import type { CollectionsApiProvider } from '../../collections/backend/api.provider.js';
import type { DriveApiProvider } from '../../drive/backend/api.provider.js';
export interface ApiRouterFeatures {
	roles: ReturnType<RolesApiProvider['compose']>;
	moderation: ReturnType<ModerationApiProvider['compose']>;
	auth: ReturnType<AuthApiProvider['compose']>;
	portability: ReturnType<PortabilityApiProvider['compose']>;
	driveManagement: ReturnType<DriveManagementApiProvider['compose']>;
	integrations: ReturnType<IntegrationsApiProvider['compose']>;
	operations: ReturnType<OperationsApiProvider['compose']>;
	federation: ReturnType<FederationApiProvider['compose']>;
	games: ReturnType<GamesApiProvider['compose']>;
	play: ReturnType<PlayApiProvider['compose']>;
	pages: ReturnType<PagesApiProvider['compose']>;
	channels: ReturnType<ChannelsApiProvider['compose']>;
	chat: ReturnType<ChatApiProvider['compose']>;
	instance: ReturnType<InstanceApiProvider['compose']>;
	statistics: ReturnType<StatisticsApiProvider['compose']>;
	discovery: ReturnType<DiscoveryApiProvider['compose']>;
	announcements: ReturnType<AnnouncementsApiProvider['compose']>;
	avatarDecorations: ReturnType<AvatarDecorationsApiProvider['compose']>;
	preferences: ReturnType<PreferencesApiProvider['compose']>;
	emojis: ReturnType<EmojisApiProvider['compose']>;
	notifications: ReturnType<NotificationsApiProvider['compose']>;
	notes: ReturnType<NotesApiProvider['compose']>;
	users: ReturnType<UsersApiProvider['compose']>;
	timelines: ReturnType<TimelinesApiProvider['compose']>;
	noteSearch: ReturnType<NoteSearchApiProvider['compose']>;
	relationships: ReturnType<RelationshipsApiProvider['compose']>;
	collections: ReturnType<CollectionsApiProvider['compose']>;
	drive: ReturnType<DriveApiProvider['compose']>;
}
export function createApiRouter(features: ApiRouterFeatures) {
	const api = implement(pilotContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(async ({ context, next }) => {
			try { return await next(); } catch (error) { throw context.mapError ? context.mapError(error) : normalizeError(error); }
		});
	return api.router({
		clearBrowserCache: createClearBrowserCacheProcedure<MiLocalUser>(),
		clearBrowserCacheGet: createClearBrowserCacheGetProcedure<MiLocalUser>(),
		test: createTestProcedure<MiLocalUser>(),
		...features,
	});
}
