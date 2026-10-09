/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedFollowing } from '@features/relationships/backend/endpoints/relationships.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { ApiActor } from '../../../../api/backend/transport/context.js';
import { federationFollowingContract } from './following.contract.js';
import type { FollowingsRepository } from '../../../../persistence/backend/repositories/models.js';
import type { QueryService } from '../../../../notes/backend/services/QueryService.js';
import type { FollowingEntityService } from '../../../../relationships/backend/serializers/FollowingEntityService.js';
import type { RoleService } from '../../../../roles/backend/services/RoleService.js';
export interface FederationFollowingDependencies {
	followingsRepository: Pick<FollowingsRepository, 'createQueryBuilder'>;
	followingEntityService: Pick<FollowingEntityService, 'packMany'>;
	queryService: Pick<QueryService, 'makePaginationQuery' | 'generateFollowingRelationVisibilityQuery'>;
	roleService: Pick<RoleService, 'isModerator'>;
}
export function createFederationFollowingProcedure<Actor extends ApiActor>(deps: FederationFollowingDependencies) {
	return createApiProcedure<Actor>()(federationFollowingContract)
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const result = await (async () => {
				const query = deps.queryService.makePaginationQuery(deps.followingsRepository.createQueryBuilder('following'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
					.andWhere('following.followerHost = :host', { host: ps.host })
					.andWhere('following.isFollowerSuspended = false');
				if (!await deps.roleService.isModerator(me)) {
					deps.queryService.generateFollowingRelationVisibilityQuery(query, 'following', me);
				}
				const followings = await query
					.limit(ps.limit)
					.getMany();
				return (await deps.followingEntityService.packMany(followings, me, { populateFollowee: true })).map(toPackedFollowing);
			})();
			return result;
		});
}
