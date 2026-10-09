/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { UtilityService } from '@features/federation/backend/services/UtilityService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { DI } from '@/di-symbols.js';
import { FollowingEntityService } from '../../serializers/FollowingEntityService.js';

import { relationshipsErrors } from '../relationships.errors.js';
import type { UsersRepository, FollowingsRepository, UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import type { RelationshipsInputs } from '../relationships.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

@Injectable()
export class UsersFollowersOperation {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private utilityService: UtilityService,
		private followingEntityService: FollowingEntityService,
		private queryService: QueryService,
		private roleService: RoleService,
	) {}

	async execute(ps: RelationshipsInputs['users/followers'], me: MiLocalUser | null) {
		const user = await this.usersRepository.findOneBy('userId' in ps
			? { id: ps.userId }
			: { usernameLower: ps.username.toLowerCase(), host: this.utilityService.toPunyNullable(ps.host) ?? IsNull() });

		if (user == null) {
			throw apiError(relationshipsErrors['users/followers'].noSuchUser);
		}

		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });

		if (profile.followersVisibility !== 'public' && !await this.roleService.isModerator(me)) {
			if (profile.followersVisibility === 'private') {
				if (me == null || (me.id !== user.id)) {
					throw apiError(relationshipsErrors['users/followers'].forbidden);
				}
			} else if (profile.followersVisibility === 'followers') {
				if (me == null) {
					throw apiError(relationshipsErrors['users/followers'].forbidden);
				} else if (me.id !== user.id) {
					const isFollowing = await this.followingsRepository.exists({
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

		const query = this.queryService.makePaginationQuery(this.followingsRepository.createQueryBuilder('following'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('following.followeeId = :userId', { userId: user.id })
			.andWhere('following.isFollowerSuspended = false')
			.innerJoinAndSelect('following.follower', 'follower');

		const followings = await query
			.limit(ps.limit)
			.getMany();

		return await this.followingEntityService.packMany(followings, me, { populateFollower: true });
	}
}
