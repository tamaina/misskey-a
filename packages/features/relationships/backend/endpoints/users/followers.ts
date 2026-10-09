/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { relationshipsContract } from '../relationships.contract.js';
import type { RelationshipsDependencies } from '../../api.dependencies.js';
import { IsNull } from 'typeorm';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { relationshipsErrors } from '../relationships.errors.js';
import { toPackedFollowing } from '../relationships.schema.js';
export function createUsersFollowersProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'usersRepository' | 'utilityService' | 'userProfilesRepository' | 'roleService' | 'followingsRepository' | 'queryService' | 'followingEntityService'>) {
	return implement(relationshipsContract["users/followers"], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'users/followers', requireCredential: false }))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const user = await deps.usersRepository.findOneBy('userId' in ps
				? { id: ps.userId }
				: { usernameLower: ps.username.toLowerCase(), host: deps.utilityService.toPunyNullable(ps.host) ?? IsNull() });

			if (user == null) {
				throw apiError(relationshipsErrors['users/followers'].noSuchUser);
			}

			const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: user.id });

			if (profile.followersVisibility !== 'public' && !await deps.roleService.isModerator(me)) {
				if (profile.followersVisibility === 'private') {
					if (me == null || (me.id !== user.id)) {
						throw apiError(relationshipsErrors['users/followers'].forbidden);
					}
				} else if (profile.followersVisibility === 'followers') {
					if (me == null) {
						throw apiError(relationshipsErrors['users/followers'].forbidden);
					} else if (me.id !== user.id) {
						const isFollowing = await deps.followingsRepository.exists({
							where: {
								followeeId: user.id,
								followerId: me.id,
								isFollowerSuspended: false,
							},
						});
						if (!isFollowing) {
							throw apiError(relationshipsErrors['users/followers'].forbidden);
						}
					}
				}
			}

			const query = deps.queryService.makePaginationQuery(deps.followingsRepository.createQueryBuilder('following'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('following.followeeId = :userId', { userId: user.id })
				.andWhere('following.isFollowerSuspended = false')
				.innerJoinAndSelect('following.follower', 'follower');

			const followings = await query
				.limit(ps.limit)
				.getMany();
			return (await deps.followingEntityService.packMany(followings, me, { populateFollower: true })).map(toPackedFollowing);
		});
}
