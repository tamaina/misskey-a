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
import type { AvatarDecorationsFeature } from '../../avatar-decorations/backend/index.js';

export { createChatCommands } from '../../chat/backend/index.js';
export { createCollectionCommands } from '../../collections/backend/index.js';
export { createEmojiAdministration, createEmojis } from '../../emojis/backend/index.js';
export { createNotifications } from '../../notifications/backend/index.js';
export { createOperations } from '../../operations/backend/index.js';
export { createPortability } from '../../portability/backend/index.js';
export { createInstance } from '../../instance/backend/index.js';
export { createStatistics } from '../../statistics/backend/index.js';
export { createAvatarDecorations } from '../../avatar-decorations/backend/index.js';

export interface FeatureApis<Room, Message, Actor extends { id: string }> {
	chatCommands: ChatCommandsFeature<Room, Message, Actor>;
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
