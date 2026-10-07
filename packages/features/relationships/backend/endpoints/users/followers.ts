/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { allOfUsersFollowersDefinition, allOfUsersFollowersInput, allOfUsersFollowersOutput } from '../../../contract/selector-common-endpoint-definitions.js';
import { IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository, FollowingsRepository, UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { FollowingEntityService } from '../../serializers/FollowingEntityService.js';
import { UtilityService } from '@features/federation/backend/services/UtilityService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(allOfUsersFollowersDefinition);

export const meta = {
	tags: ['users'],

	requireCredential: false,

	description: 'Show everyone that follows this user.',

	res: contractProjection.response,

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '27fa5435-88ab-43de-9360-387de88727cd',
		},

		forbidden: {
			message: 'Forbidden.',
			code: 'FORBIDDEN',
			id: '3c6a84db-d619-26af-ca14-06232a21df8a',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof allOfUsersFollowersInput, typeof allOfUsersFollowersOutput, 'legacy-declared'> {
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
	) {
		super(meta, contractProjection, async (ps, me) => {
			const user = await this.usersRepository.findOneBy('userId' in ps
				? { id: ps.userId }
				: { usernameLower: ps.username.toLowerCase(), host: this.utilityService.toPunyNullable(ps.host) ?? IsNull() });

			if (user == null) {
				throw new ApiError(meta.errors.noSuchUser);
			}

			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });

			if (profile.followersVisibility !== 'public' && !await this.roleService.isModerator(me)) {
				if (profile.followersVisibility === 'private') {
					if (me == null || (me.id !== user.id)) {
						throw new ApiError(meta.errors.forbidden);
					}
				} else if (profile.followersVisibility === 'followers') {
					if (me == null) {
						throw new ApiError(meta.errors.forbidden);
					} else if (me.id !== user.id) {
						const isFollowing = await this.followingsRepository.exists({
							where: {
								followeeId: user.id,
								followerId: me.id,
								isFollowerSuspended: false,
							},
						});
						if (!isFollowing) {
							throw new ApiError(meta.errors.forbidden);
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
		});
	}
}
