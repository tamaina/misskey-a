/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '../../index/backend/service-definitions.js';
import { ports } from '../../index/backend/service-ports.js';
import { EmojiEntityService } from './serializers/EmojiEntityService.js';

export const emojiServices = defineServices({
	EmojiEntityService: service(EmojiEntityService, [ports.emojisRepository, ports.rolesRepository]),
});
