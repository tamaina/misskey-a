/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EmojiEntityService } from './serializers/EmojiEntityService.js';
import type { EmojisRepository, RolesRepository } from '@/models/_.js';

export interface EmojiServicesDependencies {
	emojisRepository: EmojisRepository;
	rolesRepository: RolesRepository;
}

/** Compose this feature without starting resources or resolving a container. */
export function createEmojiServices(deps: EmojiServicesDependencies) {
	const emojiEntityService = new EmojiEntityService(deps.emojisRepository, deps.rolesRepository);

	return {
		EmojiEntityService: emojiEntityService,
	};
}

export type EmojiServices = ReturnType<typeof createEmojiServices>;
