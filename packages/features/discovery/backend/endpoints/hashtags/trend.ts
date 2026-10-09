/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FeaturedService } from '../../services/FeaturedService.js';
import { HashtagService } from '../../services/HashtagService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import { discoveryContract, type DiscoveryInputs } from '../discovery.contract.js';
export interface HashtagsTrendDependencies {
	featuredService: FeaturedService;
	hashtagService: HashtagService;
}
export function createHashtagsTrendProcedure<Actor extends MiLocalUser>(deps: HashtagsTrendDependencies) {
	const handler = async (_request: { input: DiscoveryInputs['hashtags/trend']; context: ApiContext<Actor> & { principal: Actor | null } }) => {
		const ranking = await deps.featuredService.getHashtagsRanking(10);

		const charts = ranking.length === 0 ? {} : await deps.hashtagService.getCharts(ranking, 20);

		const stats = ranking.map(tag => ({
			tag,
			chart: charts[tag],
			usersCount: Math.max(...charts[tag]),
		}));

		return stats;
	};
	return {
		canonical: implement(discoveryContract['hashtags/trend'], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: discoveryContract['hashtags/trend']['~orpc'].meta.requestName })).handler(handler),
		get: implement(discoveryContract['hashtags/trend:get'], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: discoveryContract['hashtags/trend']['~orpc'].meta.requestName })).handler(handler),
	};
}
