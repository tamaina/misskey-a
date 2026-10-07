/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { RemainingInlineNativeEndpoints } from './remaining-inline-native-endpoints.js';
import type { DriveListingNativeEndpoints } from './drive-listing-native-endpoints.js';
import type { UniqueStringNativeEndpoints } from './unique-string-native-endpoints.js';
import type { InstanceEndpoints } from '../../instance/contract/index.js';
import type { StatisticsEndpoints } from '../../statistics/contract/index.js';
import type { ChartsEndpoints } from '../../statistics/contract/chart-endpoint-definitions.js';
import type { AvatarDecorationEndpoints } from '../../avatar-decorations/contract/index.js';
import type { EmojiEndpoints } from '../../emojis/contract/index.js';
import type { OperationsEndpoints } from '../../operations/contract/index.js';
import type { PortabilityEndpoints } from '../../portability/contract/index.js';
import type { ChatEndpoints } from '../../chat/contract/index.js';
import type { CollectionEndpoints } from '../../collections/contract/index.js';
import type { NotificationsEndpoints } from '../../notifications/contract/index.js';

import type { AnnouncementEndpoints } from '../../announcements/contract/index.js';
import type { WebhookEndpoints } from '../../integrations/contract/index.js';

import type { ListEndpoints } from '../../relationships/contract/index.js';

import type { ChannelEndpoints } from '../../channels/contract/index.js';

import type { ModerationCommandEndpoints } from '../../moderation/contract/index.js';
import type { NotesCommandEndpoints } from '../../notes/contract/index.js';
import type { RelationshipEndpoints } from '../../relationships/contract/commands.js';
import type { PortabilityImportEndpoints } from '../../portability/contract/imports.js';
import type { InlineNativeEndpoints } from './inline-native-endpoints.js';
import type { PackedNativeEndpoints } from './packed-native-endpoints.js';
import type { VoidNativeEndpoints } from './void-native-endpoints.js';

export type FeatureEndpoints = ModerationCommandEndpoints
	& NotesCommandEndpoints
	& RelationshipEndpoints
	& PortabilityImportEndpoints
	& InstanceEndpoints
	& StatisticsEndpoints
	& ChartsEndpoints
	& AvatarDecorationEndpoints
	& EmojiEndpoints
	& OperationsEndpoints
	& PortabilityEndpoints
	& ChatEndpoints
	& CollectionEndpoints
	& NotificationsEndpoints
	& AnnouncementEndpoints
	& WebhookEndpoints
	& ListEndpoints
	& ChannelEndpoints
	& InlineNativeEndpoints
	& PackedNativeEndpoints
	& VoidNativeEndpoints
	& RemainingInlineNativeEndpoints
	& DriveListingNativeEndpoints
	& UniqueStringNativeEndpoints;

export type { PackedModels } from './packed.js';
