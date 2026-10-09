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

export type ApiExecutionContext<Actor extends ApiActor> = ApiContext<Actor> & {
	operations: {
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
