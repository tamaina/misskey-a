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
import type { Inputs, Outputs } from '../../index/backend/service-definitions.js';

export const discoveryServices = defineServices({
	HashtagEntityService: service(HashtagEntityService, []),
});
export const createDiscoveryServices = discoveryServices.create;
export type DiscoveryServices = Outputs<typeof discoveryServices>;

export const userSearchServices = defineServices({
	UserSearchService: service(UserSearchService, [ports.config, ports.usersRepository, ports.userProfilesRepository, ports.followingsRepository, ports.mutingsRepository, ports.userEntityService]),
});
export const createUserSearchServices = userSearchServices.create;
export type UserSearchServicesDependencies = Inputs<typeof userSearchServices>;
export type UserSearchServices = Outputs<typeof userSearchServices>;

const featuredService = service(FeaturedService, [ports.redisClient]);
export const rankingServices = defineServices({
	FeaturedService: featuredService,
	HashtagService: service(HashtagService, [ports.db, ports.meta, ports.redisClient, ports.hashtagsRepository, ports.userEntityService, featuredService, ports.idService, ports.utilityService]),
});
export const createRankingServices = rankingServices.create;
export type RankingServicesDependencies = Inputs<typeof rankingServices>;
export type RankingServices = Outputs<typeof rankingServices>;
