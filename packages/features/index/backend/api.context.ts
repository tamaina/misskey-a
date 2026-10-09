/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { InstanceOperations } from '../../instance/backend/operations.js';
import type { StatisticsOperations } from '../../statistics/backend/operations.js';
import type { DiscoveryOperations } from '../../discovery/backend/endpoints/discovery.js';
import type { AnnouncementsOperations } from '../../announcements/backend/api.operations.js';
import type { AvatarDecorationsOperations } from '../../avatar-decorations/backend/api.operations.js';
import type { EmojisOperations } from '../../emojis/backend/api.operations.js';
import type { NotificationsOperations } from '../../notifications/backend/operations.js';
import type { PreferencesOperations } from '../../preferences/backend/operations.js';

import type { NotesOperations } from '../../notes/backend/operations.js';

import type { UsersOperations } from '../../users/backend/api.router.js';

import type { TimelinesOperations } from '../../timelines/backend/operations.js';

import type { NoteSearchOperations } from '../../note-search/backend/operations.js';

import type { RelationshipsOperations } from '../../relationships/backend/endpoints/relationships.js';

import type { CollectionsOperations } from '../../collections/backend/api.operations.js';

import type { ChatOperations } from '../../chat/backend/operations.js';

import type { ChannelsOperations } from '../../channels/backend/operations.js';

import type { PagesOperations } from '../../pages/backend/operations.js';

import type { PlayOperations } from '../../play/backend/operations.js';

import type { GamesOperations } from '../../games/backend/operations.js';

import type { FederationOperations } from '../../federation/backend/operations.js';

import type { OperationsApiOperations } from '../../operations/backend/operations.js';

import type { IntegrationsOperations } from '../../integrations/backend/operations.js';

import type { DriveManagementOperations } from '../../drive/backend/management.router.js';

import type { PortabilityOperations } from '../../portability/backend/api.router.js';

import type { AuthOperations } from '../../auth/backend/api.router.js';

import type { ModerationOperations } from '../../moderation/backend/api.operations.js';

import type { RolesOperations } from '../../roles/backend/api.operations.js';

export type ApiExecutionContext<Actor extends ApiActor> = ApiContext<Actor> & {
	operations: {
		roles: RolesOperations<Actor>;
		moderation: ModerationOperations<Actor>;
		auth: AuthOperations<Actor>;
		portability: PortabilityOperations<Actor>;
		driveManagement: DriveManagementOperations<Actor>;
		integrations: IntegrationsOperations<Actor>;
		operations: OperationsApiOperations<Actor>;
		federation: FederationOperations<Actor>;
		games: GamesOperations<Actor>;
		play: PlayOperations<Actor>;
		pages: PagesOperations<Actor>;
		channels: ChannelsOperations<Actor>;
		chat: ChatOperations<Actor>;
		notes: NotesOperations<Actor>;
		users: UsersOperations<Actor>;
		timelines: TimelinesOperations<Actor>;
		noteSearch: NoteSearchOperations<Actor>;
		relationships: RelationshipsOperations<Actor>;
		collections: CollectionsOperations<Actor>;
		instance: InstanceOperations<Actor>;
		statistics: StatisticsOperations<Actor>;
		discovery: DiscoveryOperations<Actor>;
		announcements: AnnouncementsOperations<Actor>;
		avatarDecorations: AvatarDecorationsOperations<Actor>;
		preferences: PreferencesOperations<Actor>;
		emojis: EmojisOperations<Actor>;
		notifications: NotificationsOperations<Actor>;
	};
};
