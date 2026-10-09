/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DiscoveryInputs } from '../discovery.contract.js';
import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository, FollowingsRepository } from '@features/persistence/backend/repositories/models.js';

import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { DI } from '@/di-symbols.js';

@Injectable()
export class UsersRecommendationOperation {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userEntityService: UserEntityService,
		private queryService: QueryService,
	) {
	}

	async execute(ps: DiscoveryInputs['users/recommendation'], me: MiLocalUser) {
		const query = this.usersRepository.createQueryBuilder('user')
			.where('user.isLocked = FALSE')
			.andWhere('user.isExplorable = TRUE')
			.andWhere('user.host IS NULL')
			.andWhere('user.updatedAt >= :date', { date: new Date(Date.now() - ms('7days')) })
			.andWhere('user.id != :meId', { meId: me.id })
			.orderBy('user.followersCount', 'DESC');

		this.queryService.generateMutedUserQueryForUsers(query, me);
		this.queryService.generateBlockQueryForUsers(query, me);
		this.queryService.generateBlockedUserQueryForNotes(query, me);
		this.queryService.generateBlockedUserQueryForNotes(query, me, { noteColumn: 'renote' });

		const followingQuery = this.followingsRepository.createQueryBuilder('following')
			.select('following.followeeId')
			.where('following.followerId = :followerId', { followerId: me.id })
			.andWhere('following.isFollowerSuspended = false');

		query
			.andWhere(`user.id NOT IN (${ followingQuery.getQuery() })`);

		query.setParameters(followingQuery.getParameters());

		const users = await query.limit(ps.limit).offset(ps.offset).getMany();

		return await this.userEntityService.packMany(users, me, { schema: 'UserDetailed' });
	}
}
