/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InstanceEndpoints } from '../../instance/contract/index.js';
import type { StatisticsEndpoints } from '../../statistics/contract/index.js';
import type { AvatarDecorationEndpoints } from '../../avatar-decorations/contract/index.js';
import type { EmojiEndpoints } from '../../emojis/contract/index.js';
import type { OperationsEndpoints } from '../../operations/contract/index.js';
import type { PortabilityEndpoints } from '../../portability/contract/index.js';
import type { ChatEndpoints } from '../../chat/contract/index.js';
import type { CollectionEndpoints } from '../../collections/contract/index.js';
import type { NotificationsEndpoints } from '../../notifications/contract/index.js';

export type FeatureEndpoints = InstanceEndpoints
	& StatisticsEndpoints
	& AvatarDecorationEndpoints
	& EmojiEndpoints
	& OperationsEndpoints
	& PortabilityEndpoints
	& ChatEndpoints
	& CollectionEndpoints
	& NotificationsEndpoints;
