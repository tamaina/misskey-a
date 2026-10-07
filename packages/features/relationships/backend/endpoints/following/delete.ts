/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedFollowingDeleteDefinition, packedFollowingDeleteInput, packedFollowingDeleteOutput } from '../../../contract/packed-endpoint-definitions.js';
import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';

import type { FollowingsRepository } from '@features/persistence/backend/repositories/models.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { UserFollowingService } from '../../services/UserFollowingService.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedFollowingDeleteDefinition);

export const meta = {
	tags: ['following', 'users'],

	limit: {
		duration: ms('1hour'),
		max: 100,
	},

	requireCredential: true,

	kind: 'write:following',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '5b12c78d-2b28-4dca-99d2-f56139b42ff8',
		},

		followeeIsYourself: {
			message: 'Followee is yourself.',
			code: 'FOLLOWEE_IS_YOURSELF',
			id: 'd9e400b9-36b0-4808-b1d8-79e707f1296c',
		},

		notFollowing: {
			message: 'You are not following that user.',
			code: 'NOT_FOLLOWING',
			id: '5dbf82f5-c92b-40b1-87d1-6c8c0741fd09',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedFollowingDeleteInput, typeof packedFollowingDeleteOutput> {
	constructor(
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userEntityService: UserEntityService,
		private getterService: GetterService,
		private userFollowingService: UserFollowingService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const follower = me;

			// Check if the followee is yourself
			if (me.id === ps.userId) {
				throw new ApiError(meta.errors.followeeIsYourself);
			}

			// Get followee
			const followee = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
				throw err;
			});

			// Check not following
			const exist = await this.followingsRepository.exists({
				where: {
					followerId: follower.id,
					followeeId: followee.id,
				},
			});

			if (!exist) {
				throw new ApiError(meta.errors.notFollowing);
			}

			await this.userFollowingService.unfollow(follower, followee);

			return await this.userEntityService.pack(followee.id, me);
		});
	}
}
