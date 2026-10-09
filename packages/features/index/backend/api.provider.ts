/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { createApiRouter } from './api.router.js';
import { getPilotEndpointDescriptors } from '../../api/backend/transport/openapi/pilot-spec.js';
import { RolesApiProvider } from '../../roles/backend/api.provider.js';
import { ModerationApiProvider } from '../../moderation/backend/api.provider.js';
import { AuthApiProvider } from '../../auth/backend/api.provider.js';
import { PortabilityApiProvider } from '../../portability/backend/api.provider.js';
import { DriveManagementApiProvider } from '../../drive/backend/management.provider.js';
import { IntegrationsApiProvider } from '../../integrations/backend/api.provider.js';
import { OperationsApiProvider } from '../../operations/backend/api.provider.js';
import { FederationApiProvider } from '../../federation/backend/api.provider.js';
import { GamesApiProvider } from '../../games/backend/api.provider.js';
import { PlayApiProvider } from '../../play/backend/api.provider.js';
import { PagesApiProvider } from '../../pages/backend/api.provider.js';
import { ChannelsApiProvider } from '../../channels/backend/api.provider.js';
import { ChatApiProvider } from '../../chat/backend/api.provider.js';
import { InstanceApiProvider } from '../../instance/backend/api.provider.js';
import { StatisticsApiProvider } from '../../statistics/backend/api.provider.js';
import { DiscoveryApiProvider } from '../../discovery/backend/api.provider.js';
import { AnnouncementsApiProvider } from '../../announcements/backend/api.provider.js';
import { AvatarDecorationsApiProvider } from '../../avatar-decorations/backend/api.implementation.js';
import { PreferencesApiProvider } from '../../preferences/backend/api.provider.js';
import { EmojisApiProvider } from '../../emojis/backend/api.provider.js';
import { NotificationsApiProvider } from '../../notifications/backend/api.provider.js';
import { NotesApiProvider } from '../../notes/backend/api.provider.js';
import { UsersApiProvider } from '../../users/backend/api.provider.js';
import { TimelinesApiProvider } from '../../timelines/backend/api.provider.js';
import { NoteSearchApiProvider } from '../../note-search/backend/api.provider.js';
import { RelationshipsApiProvider } from '../../relationships/backend/api.provider.js';
import { CollectionsApiProvider } from '../../collections/backend/api.provider.js';
import { DriveApiProvider } from '../../drive/backend/api.provider.js';
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
