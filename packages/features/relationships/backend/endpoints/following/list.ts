/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { relationshipsContract } from '../relationships.contract.js';
import type { RelationshipsDependencies } from '../../api.implementation.js';
import { toPackedFollowing } from '../relationships.schema.js';
export function createFollowingListProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'queryService' | 'followingsRepository' | 'followingEntityService'>) {
	return implement(relationshipsContract["following/list"], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'following/list', requireCredential: true, kind: 'read:following' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.followingsRepository.createQueryBuilder('following'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('following.followerId = :userId', { userId: me.id });

			if (ps.notification) {
				query.andWhere('following.notify IS NOT NULL');
			}

			query.innerJoinAndSelect('following.followee', 'followee');

			const followings = await query
				.limit(ps.limit)
				.getMany();
			return (await deps.followingEntityService.packMany(followings, me, { populateFollowee: true })).map(toPackedFollowing);
		});
}
