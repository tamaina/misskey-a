/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Provider } from '@nestjs/common';
import { ApiRouterProvider } from './api.implementation.js';
import { RolesApiProvider } from '@features/roles/backend/api.implementation.js';
import { ModerationApiProvider } from '@features/moderation/backend/api.implementation.js';
import { AuthApiProvider } from '@features/auth/backend/api.implementation.js';
import { PortabilityApiProvider } from '@features/portability/backend/api.implementation.js';
import { DriveManagementApiProvider } from '@features/drive/backend/api.implementation.js';
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
import { DriveApiProvider } from '@features/drive/backend/api.implementation.js';
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
