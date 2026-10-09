/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { authentication, apiPolicy } from '@features/api/backend/transport/middleware.js';
import { relationshipsContract } from '../relationships.contract.js';
import type { RelationshipsDependencies } from '../../api.implementation.js';
import { IsNull } from 'typeorm';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { relationshipsErrors } from '../relationships.errors.js';
import { toPackedFollowing } from '../relationships.schema.js';
export function createUsersFollowingProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'usersRepository' | 'utilityService' | 'userProfilesRepository' | 'roleService' | 'followingsRepository' | 'queryService' | 'followingEntityService'>) {
	return implement(relationshipsContract["users/following"], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'users/following', requireCredential: false }))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const user = await deps.usersRepository.findOneBy('userId' in ps
				? { id: ps.userId }
				: { usernameLower: ps.username.toLowerCase(), host: deps.utilityService.toPunyNullable(ps.host) ?? IsNull() });

			if (user == null) {
				throw apiError(relationshipsErrors['users/following'].noSuchUser);
			}

			const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: user.id });

			if (profile.followingVisibility !== 'public' && !await deps.roleService.isModerator(me)) {
				if (profile.followingVisibility === 'private') {
					if (me == null || (me.id !== user.id)) {
						throw apiError(relationshipsErrors['users/following'].forbidden);
					}
				} else if (profile.followingVisibility === 'followers') {
					if (me == null) {
						throw apiError(relationshipsErrors['users/following'].forbidden);
					} else if (me.id !== user.id) {
						const isFollowing = await deps.followingsRepository.exists({
							where: {
								followeeId: user.id,
								followerId: me.id,
								isFollowerSuspended: false,
							},
						});
						if (!isFollowing) {
							throw apiError(relationshipsErrors['users/following'].forbidden);
						}
					}
				}
			}

			const query = deps.queryService.makePaginationQuery(deps.followingsRepository.createQueryBuilder('following'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('following.followerId = :userId', { userId: user.id })
				.andWhere('following.isFollowerSuspended = false')
				.innerJoinAndSelect('following.followee', 'followee');

			// @deprecated use get-following-users-by-birthday instead.
			if (ps.birthday) {
				query.innerJoin(deps.userProfilesRepository.metadata.targetName, 'followeeProfile', 'followeeProfile.userId = following.followeeId');

				try {
					const birthday = ps.birthday.split('-');
					birthday.shift(); // 年の部分を削除
					// なぜか get_birthday_date() = :birthday だとインデックスが効かないので、BETWEEN で対応
					query.andWhere('get_birthday_date(followeeProfile.birthday) BETWEEN :birthday AND :birthday', { birthday: parseInt(birthday.join('')) });
				} catch (_) {
					throw apiError(relationshipsErrors['users/following'].birthdayInvalid);
				}
			}

			const followings = await query
				.limit(ps.limit)
				.getMany();
			return (await deps.followingEntityService.packMany(followings, me, { populateFollowee: true })).map(toPackedFollowing);
		});
}
