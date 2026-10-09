/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { pilotContract } from './api.definition.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { normalizeError } from '@features/api/backend/transport/orpc-error.js';
import { createTestProcedure } from '@features/api/backend/endpoints/test.js';
import { createClearBrowserCacheProcedure, createClearBrowserCacheGetProcedure } from '@features/api/backend/endpoints/clear-browser-cache.js';
import { RolesApiProvider } from '@features/roles/backend/api.implementation.js';
import { ModerationApiProvider } from '@features/moderation/backend/api.implementation.js';
import { AuthApiProvider } from '@features/auth/backend/api.implementation.js';
import { PortabilityApiProvider } from '@features/portability/backend/api.implementation.js';
import { DriveManagementApiProvider, DriveApiProvider } from '@features/drive/backend/api.implementation.js';
import { IntegrationsApiProvider } from '@features/integrations/backend/api.implementation.js';
import { OperationsApiProvider } from '@features/operations/backend/api.implementation.js';
import { FederationApiProvider } from '@features/federation/backend/api.implementation.js';
import { GamesApiProvider } from '@features/games/backend/api.implementation.js';
import { PlayApiProvider } from '@features/play/backend/api.implementation.js';
import { PagesApiProvider } from '@features/pages/backend/api.implementation.js';
import { ChannelsApiProvider } from '@features/channels/backend/api.implementation.js';
import { ChatApiProvider } from '@features/chat/backend/api.implementation.js';
import { InstanceApiProvider } from '@features/instance/backend/api.implementation.js';
import { StatisticsApiProvider } from '@features/statistics/backend/api.implementation.js';
import { DiscoveryApiProvider } from '@features/discovery/backend/api.implementation.js';
import { AnnouncementsApiProvider } from '@features/announcements/backend/api.implementation.js';
import { AvatarDecorationsApiProvider } from '@features/avatar-decorations/backend/api.implementation.js';
import { PreferencesApiProvider } from '@features/preferences/backend/api.implementation.js';
import { EmojisApiProvider } from '@features/emojis/backend/api.implementation.js';
import { NotificationsApiProvider } from '@features/notifications/backend/api.implementation.js';
import { NotesApiProvider } from '@features/notes/backend/api.implementation.js';
import { UsersApiProvider } from '@features/users/backend/api.implementation.js';
import { TimelinesApiProvider } from '@features/timelines/backend/api.implementation.js';
import { NoteSearchApiProvider } from '@features/note-search/backend/api.implementation.js';
import { RelationshipsApiProvider } from '@features/relationships/backend/api.implementation.js';
import { CollectionsApiProvider } from '@features/collections/backend/api.implementation.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { getPilotEndpointDescriptors } from '@features/api/backend/transport/openapi/pilot-spec.js';

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

type ApiRouter = ReturnType<typeof createApiRouter>;

@Injectable()
export class ApiRouterProvider {
	private router: ApiRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): ApiRouter {
		if (this.router !== undefined) return this.router;
		this.router = createApiRouter({
			roles: this.moduleRef.get(RolesApiProvider, { strict: false }).compose(),
			moderation: this.moduleRef.get(ModerationApiProvider, { strict: false }).compose(),
			auth: this.moduleRef.get(AuthApiProvider, { strict: false }).compose(),
			portability: this.moduleRef.get(PortabilityApiProvider, { strict: false }).compose(),
			driveManagement: this.moduleRef.get(DriveManagementApiProvider, { strict: false }).compose(),
			integrations: this.moduleRef.get(IntegrationsApiProvider, { strict: false }).compose(),
			operations: this.moduleRef.get(OperationsApiProvider, { strict: false }).compose(),
			federation: this.moduleRef.get(FederationApiProvider, { strict: false }).compose(),
			games: this.moduleRef.get(GamesApiProvider, { strict: false }).compose(),
			play: this.moduleRef.get(PlayApiProvider, { strict: false }).compose(),
			pages: this.moduleRef.get(PagesApiProvider, { strict: false }).compose(),
			channels: this.moduleRef.get(ChannelsApiProvider, { strict: false }).compose(),
			chat: this.moduleRef.get(ChatApiProvider, { strict: false }).compose(),
			instance: this.moduleRef.get(InstanceApiProvider, { strict: false }).compose(async () => (await getPilotEndpointDescriptors()).sort((a, b) => a.name.localeCompare(b.name))),
			statistics: this.moduleRef.get(StatisticsApiProvider, { strict: false }).compose(),
			discovery: this.moduleRef.get(DiscoveryApiProvider, { strict: false }).compose(),
			announcements: this.moduleRef.get(AnnouncementsApiProvider, { strict: false }).compose(),
			avatarDecorations: this.moduleRef.get(AvatarDecorationsApiProvider, { strict: false }).compose(),
			preferences: this.moduleRef.get(PreferencesApiProvider, { strict: false }).compose(),
			emojis: this.moduleRef.get(EmojisApiProvider, { strict: false }).compose(),
			notifications: this.moduleRef.get(NotificationsApiProvider, { strict: false }).compose(),
			notes: this.moduleRef.get(NotesApiProvider, { strict: false }).compose(),
			users: this.moduleRef.get(UsersApiProvider, { strict: false }).compose(),
			timelines: this.moduleRef.get(TimelinesApiProvider, { strict: false }).compose(),
			noteSearch: this.moduleRef.get(NoteSearchApiProvider, { strict: false }).compose(),
			relationships: this.moduleRef.get(RelationshipsApiProvider, { strict: false }).compose(),
			collections: this.moduleRef.get(CollectionsApiProvider, { strict: false }).compose(),
			drive: this.moduleRef.get(DriveApiProvider, { strict: false }).compose(),
		});
		return this.router;
	}
}
