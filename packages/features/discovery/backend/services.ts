/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { HashtagEntityService } from './serializers/HashtagEntityService.js';

/** Compose this feature without starting resources or resolving a container. */
export function createDiscoveryServices() {
	const hashtagEntityService = new HashtagEntityService();

	return {
		HashtagEntityService: hashtagEntityService,
	};
}

export type DiscoveryServices = ReturnType<typeof createDiscoveryServices>;
