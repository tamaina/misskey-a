/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import { federationFollowersContract } from './followers.contract.js';
import type { FollowingsRepository } from '../../../../persistence/backend/repositories/models.js';
import type { QueryService } from '../../../../notes/backend/services/QueryService.js';
import type { FollowingEntityService } from '../../../../relationships/backend/serializers/FollowingEntityService.js';
import type { RoleService } from '../../../../roles/backend/services/RoleService.js';
import * as v from 'valibot';
export interface FederationFollowersDependencies {
	followingsRepository: Pick<FollowingsRepository, 'createQueryBuilder'>;
	followingEntityService: Pick<FollowingEntityService, 'packMany'>;
	queryService: Pick<QueryService, 'makePaginationQuery' | 'generateFollowingRelationVisibilityQuery'>;
	roleService: Pick<RoleService, 'isModerator'>;
}
export function createFederationFollowersProcedure<Actor extends ApiActor>(deps: FederationFollowersDependencies) {
	return implement(federationFollowersContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: federationFollowersContract['~orpc'].meta.requestName }))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const result = await (async () => {
				const query = deps.queryService.makePaginationQuery(deps.followingsRepository.createQueryBuilder('following'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
					.andWhere('following.followeeHost = :host', { host: ps.host })
					.andWhere('following.isFollowerSuspended = false');
				if (!await deps.roleService.isModerator(me)) {
					deps.queryService.generateFollowingRelationVisibilityQuery(query, 'followers', me);
				}
				const followings = await query
					.limit(ps.limit)
					.getMany();
				return await deps.followingEntityService.packMany(followings, me, { populateFollowee: true });
			})();
			return v.parse(federationFollowersContract['~orpc'].outputSchema!, result);
		});
}
