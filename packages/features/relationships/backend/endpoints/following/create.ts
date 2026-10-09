/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';

import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
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
export class FollowingCreateOperation {
	constructor(
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userEntityService: UserEntityService,
		private getterService: GetterService,
		private userFollowingService: UserFollowingService,
	) {}

	async execute(ps: RelationshipsInputs['following/create'], me: MiLocalUser) {
		const follower = me;

		// 自分自身
		if (me.id === ps.userId) {
			throw apiError(relationshipsErrors['following/create'].followeeIsYourself);
		}

		// Get followee
		const followee = await this.getterService.getUser(ps.userId).catch(err => {
			if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(relationshipsErrors['following/create'].noSuchUser);
			throw err;
		});

		try {
			await this.userFollowingService.follow(follower, followee, { withReplies: ps.withReplies });
		} catch (e) {
			if (e instanceof IdentifiableError) {
				if (e.id === 'ec3f65c0-a9d1-47d9-8791-b2e7b9dcdced') throw apiError(relationshipsErrors['following/create'].alreadyFollowing);
				if (e.id === '710e8fb0-b8c3-4922-be49-d5d93d8e6a6e') throw apiError(relationshipsErrors['following/create'].blocking);
				if (e.id === '3338392a-f764-498d-8855-db939dcf8c48') throw apiError(relationshipsErrors['following/create'].blocked);
			}
			throw e;
		}

		return await this.userEntityService.pack(followee.id, me);
	}
}
