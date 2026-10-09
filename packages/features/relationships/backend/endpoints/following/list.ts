/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DI } from '@/di-symbols.js';
import { FollowingEntityService } from '../../serializers/FollowingEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { RelationshipsInputs } from '../relationships.contract.js';
import type { FollowingsRepository } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class FollowingListOperation {
	constructor(
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private followingEntityService: FollowingEntityService,
		private queryService: QueryService,
	) {}

	async execute(ps: RelationshipsInputs['following/list'], me: MiLocalUser) {
		const query = this.queryService.makePaginationQuery(this.followingsRepository.createQueryBuilder('following'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('following.followerId = :userId', { userId: me.id });

		if (ps.notification) {
			query.andWhere('following.notify IS NOT NULL');
		}

		query.innerJoinAndSelect('following.followee', 'followee');

		const followings = await query
			.limit(ps.limit)
			.getMany();

		return await this.followingEntityService.packMany(followings, me, { populateFollowee: true });
	}
}
