/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { allOfUsersFollowingDefinition, allOfUsersFollowingInput, allOfUsersFollowingOutput } from '../../../contract/selector-common-endpoint-definitions.js';
import { IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository, FollowingsRepository, UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { FollowingEntityService } from '../../serializers/FollowingEntityService.js';
import { UtilityService } from '@features/federation/backend/services/UtilityService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(allOfUsersFollowingDefinition);

export const meta = {
	tags: ['users'],

	requireCredential: false,

	description: 'Show everyone that this user is following.',

	res: contractProjection.response,

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '63e4aba4-4156-4e53-be25-c9559e42d71b',
		},

		forbidden: {
			message: 'Forbidden.',
			code: 'FORBIDDEN',
			id: 'f6cdb0df-c19f-ec5c-7dbb-0ba84a1f92ba',
		},

		birthdayInvalid: {
			message: 'Birthday date format is invalid.',
			code: 'BIRTHDAY_DATE_FORMAT_INVALID',
			id: 'a2b007b9-4782-4eba-abd3-93b05ed4130d',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof allOfUsersFollowingInput, typeof allOfUsersFollowingOutput, 'legacy-declared'> {
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

			if (profile.followingVisibility !== 'public' && !await this.roleService.isModerator(me)) {
				if (profile.followingVisibility === 'private') {
					if (me == null || (me.id !== user.id)) {
						throw new ApiError(meta.errors.forbidden);
					}
				} else if (profile.followingVisibility === 'followers') {
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
				.andWhere('following.followerId = :userId', { userId: user.id })
				.andWhere('following.isFollowerSuspended = false')
				.innerJoinAndSelect('following.followee', 'followee');

			// @deprecated use get-following-users-by-birthday instead.
			if (ps.birthday) {
				query.innerJoin(this.userProfilesRepository.metadata.targetName, 'followeeProfile', 'followeeProfile.userId = following.followeeId');

				try {
					const birthday = ps.birthday.split('-');
					birthday.shift(); // 年の部分を削除
					// なぜか get_birthday_date() = :birthday だとインデックスが効かないので、BETWEEN で対応
					query.andWhere('get_birthday_date(followeeProfile.birthday) BETWEEN :birthday AND :birthday', { birthday: parseInt(birthday.join('')) });
				} catch (_) {
					throw new ApiError(meta.errors.birthdayInvalid);
				}
			}

			const followings = await query
				.limit(ps.limit)
				.getMany();

			return await this.followingEntityService.packMany(followings, me, { populateFollowee: true });
		});
	}
}
