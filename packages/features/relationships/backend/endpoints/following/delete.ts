/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';

import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { DI } from '@/di-symbols.js';
import { UserFollowingService } from '../../services/UserFollowingService.js';

import { relationshipsErrors } from '../relationships.errors.js';
import type { FollowingsRepository } from '@features/persistence/backend/repositories/models.js';
import type { RelationshipsInputs } from '../relationships.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

@Injectable()
export class FollowingDeleteOperation {
	constructor(
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userEntityService: UserEntityService,
		private getterService: GetterService,
		private userFollowingService: UserFollowingService,
	) {}

	async execute(ps: RelationshipsInputs['following/delete'], me: MiLocalUser) {
		const follower = me;

		// Check if the followee is yourself
		if (me.id === ps.userId) {
			throw apiError(relationshipsErrors['following/delete'].followeeIsYourself);
		}

		// Get followee
		const followee = await this.getterService.getUser(ps.userId).catch(err => {
			if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(relationshipsErrors['following/delete'].noSuchUser);
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
			throw apiError(relationshipsErrors['following/delete'].notFollowing);
		}

		await this.userFollowingService.unfollow(follower, followee);

		return await this.userEntityService.pack(followee.id, me);
	}
}
