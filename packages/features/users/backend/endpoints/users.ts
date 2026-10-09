/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '../serializers/UserEntityService.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { UsersInputs } from '../api.contract.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class UsersOperation {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
		private queryService: QueryService,
	) {
	}

	async execute(ps: UsersInputs['users'], me: MiLocalUser | null, _token: ApiToken | null, _ip: string) {
		const query = this.usersRepository.createQueryBuilder('user')
			.where('user.isExplorable = TRUE')
			.andWhere('user.isSuspended = FALSE');

		switch (ps.state) {
			case 'alive': query.andWhere('user.updatedAt > :date', { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) }); break;
		}

		switch (ps.origin) {
			case 'local': query.andWhere('user.host IS NULL'); break;
			case 'remote': query.andWhere('user.host IS NOT NULL'); break;
		}

		if (ps.hostname) {
			query.andWhere('user.host = :hostname', { hostname: ps.hostname.toLowerCase() });
		}

		switch (ps.sort) {
			case '+follower': query.orderBy('user.followersCount', 'DESC'); break;
			case '-follower': query.orderBy('user.followersCount', 'ASC'); break;
			case '+createdAt': query.orderBy('user.id', 'DESC'); break;
			case '-createdAt': query.orderBy('user.id', 'ASC'); break;
			case '+updatedAt': query.andWhere('user.updatedAt IS NOT NULL').orderBy('user.updatedAt', 'DESC'); break;
			case '-updatedAt': query.andWhere('user.updatedAt IS NOT NULL').orderBy('user.updatedAt', 'ASC'); break;
			default: query.orderBy('user.id', 'ASC'); break;
		}

		if (me) this.queryService.generateMutedUserQueryForUsers(query, me);
		if (me) this.queryService.generateBlockQueryForUsers(query, me);

		query.limit(ps.limit);
		query.offset(ps.offset);

		const users = await query.getMany();

		return await this.userEntityService.packMany(users, me, { schema: 'UserDetailed' });
	}
}
