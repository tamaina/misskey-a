/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '../../index/backend/service-definitions.js';
import { ports } from '../../index/backend/service-ports.js';
import { HashtagService } from './services/HashtagService.js';
import { FeaturedService } from './services/FeaturedService.js';
import { UserSearchService } from './services/UserSearchService.js';
import { HashtagEntityService } from './serializers/HashtagEntityService.js';

export const discoveryServices = defineServices({
	HashtagEntityService: service(HashtagEntityService, []),
});

export const userSearchServices = defineServices({
	UserSearchService: service(UserSearchService, [ports.config, ports.usersRepository, ports.userProfilesRepository, ports.followingsRepository, ports.mutingsRepository, ports.userEntityService]),
});

const featuredService = service(FeaturedService, [ports.redisClient]);
export const rankingServices = defineServices({
	FeaturedService: featuredService,
	HashtagService: service(HashtagService, [ports.db, ports.meta, ports.redisClient, ports.hashtagsRepository, ports.userEntityService, featuredService, ports.idService, ports.utilityService]),
});
