/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ChatCommandsFeature } from '../../chat/backend/index.js';
import type { CollectionCommandsFeature } from '../../collections/backend/index.js';
import type { EmojiAdministrationFeature, EmojisFeature } from '../../emojis/backend/index.js';
import type { NotificationsFeature } from '../../notifications/backend/index.js';
import type { OperationsFeature } from '../../operations/backend/index.js';
import type { PortabilityFeature } from '../../portability/backend/index.js';
import type { InstanceFeature } from '../../instance/backend/index.js';
import type { StatisticsFeature } from '../../statistics/backend/index.js';
import type { AvatarDecorationCommandsFeature, AvatarDecorationsFeature } from '../../avatar-decorations/backend/index.js';

export { createChatCommands } from '../../chat/backend/index.js';
export { createCollectionCommands } from '../../collections/backend/index.js';
export { createEmojiAdministration, createEmojis } from '../../emojis/backend/index.js';
export { createNotifications } from '../../notifications/backend/index.js';
export { createOperations } from '../../operations/backend/index.js';
export { createPortability } from '../../portability/backend/index.js';
export { createInstance } from '../../instance/backend/index.js';
export { createStatistics } from '../../statistics/backend/index.js';
export { createAvatarDecorationCommands, createAvatarDecorations } from '../../avatar-decorations/backend/index.js';

import type { AnnouncementCommandsFeature } from '../../announcements/backend/index.js';
import type { WebhookCommandsFeature } from '../../integrations/backend/index.js';
export { createAnnouncementCommands } from '../../announcements/backend/index.js';
export { createWebhookCommands } from '../../integrations/backend/index.js';

import type { ListCommandsFeature } from '../../relationships/backend/index.js';
export { createListCommands } from '../../relationships/backend/index.js';

import type { ChannelCommandsFeature } from '../../channels/backend/index.js';
import type { ClipFavoriteCommandsFeature } from '../../collections/backend/index.js';
export { createChannelCommands } from '../../channels/backend/index.js';
export { createClipFavoriteCommands } from '../../collections/backend/index.js';

/** Domain models supplied by the backend composition root, never imported here. */
export interface FeatureApiModels {
	channel: { id: string };
	clip: { id: string; userId: string; isPublic: boolean };
	clipFavorite: { id: string };
	room: unknown;
	message: unknown;
	actor: { id: string };
	announcement: unknown;
	webhook: { id: string };
	list: { id: string };
	user: { id: string };
	favorite: { id: string };
}

export interface FeatureApis<Models extends FeatureApiModels> {
	channelCommands: ChannelCommandsFeature<Models['channel'], Models['actor']>;
	clipFavoriteCommands: ClipFavoriteCommandsFeature<Models['clip'], Models['clipFavorite']>;
	listCommands: ListCommandsFeature<Models['list'], Models['user'], Models['actor'], Models['favorite']>;
	avatarDecorationCommands: AvatarDecorationCommandsFeature<Models['actor']>;
	announcementCommands: AnnouncementCommandsFeature<Models['announcement'], Models['actor']>;
	webhookCommands: WebhookCommandsFeature<Models['webhook']>;
	chatCommands: ChatCommandsFeature<Models['room'], Models['message'], Models['actor']>;
	collectionCommands: CollectionCommandsFeature;
	emojiAdministration: EmojiAdministrationFeature;
	notifications: NotificationsFeature;
	operations: OperationsFeature;
	portability: PortabilityFeature;
	instance: InstanceFeature;
	statistics: StatisticsFeature;
	avatarDecorations: AvatarDecorationsFeature;
	emojis: EmojisFeature;
}
