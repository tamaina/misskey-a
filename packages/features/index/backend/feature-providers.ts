/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Provider } from '@nestjs/common';
import { ApiRouterProvider } from './api.provider.js';
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
import { AvatarDecorationsApiProvider } from '../../avatar-decorations/backend/api.provider.js';
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
export const featureProviders: Provider[] = [
	ApiRouterProvider,
	RolesApiProvider,
	ModerationApiProvider,
	AuthApiProvider,
	PortabilityApiProvider,
	DriveManagementApiProvider,
	IntegrationsApiProvider,
	OperationsApiProvider,
	FederationApiProvider,
	GamesApiProvider,
	PlayApiProvider,
	PagesApiProvider,
	ChannelsApiProvider,
	ChatApiProvider,
	InstanceApiProvider,
	StatisticsApiProvider,
	DiscoveryApiProvider,
	AnnouncementsApiProvider,
	AvatarDecorationsApiProvider,
	PreferencesApiProvider,
	EmojisApiProvider,
	NotificationsApiProvider,
	NotesApiProvider,
	UsersApiProvider,
	TimelinesApiProvider,
	NoteSearchApiProvider,
	RelationshipsApiProvider,
	CollectionsApiProvider,
	DriveApiProvider,
];
