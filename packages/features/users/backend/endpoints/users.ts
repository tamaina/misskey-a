/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { type QueryService } from '@features/notes/backend/services/QueryService.js';
import { type UserEntityService } from '../serializers/UserEntityService.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { UsersInputs } from '../api.definition.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { usersContract } from './users.contract.js';

import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
export interface UsersDependencies {
	usersRepository: UsersRepository;
	userEntityService: UserEntityService;
	queryService: QueryService;
}
export function createUsersProcedure(deps: UsersDependencies) {
	async function execute(ps: UsersInputs['users'], me: MiLocalUser | null, _token: ApiToken | null, _ip: string) {
		const query = deps.usersRepository.createQueryBuilder('user')
			.where('user.isExplorable = TRUE')
			.andWhere('user.isSuspended = FALSE')
			.andWhere('user.isRemoteSuspended = FALSE');

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

		if (me) deps.queryService.generateMutedUserQueryForUsers(query, me);
		if (me) deps.queryService.generateBlockQueryForUsers(query, me);

		query.limit(ps.limit);
		query.offset(ps.offset);

		const users = await query.getMany();

		return await deps.userEntityService.packMany(users, me, { schema: 'UserDetailed' });
	}

	return createApiProcedure<MiLocalUser>()(usersContract)
		.handler(async ({ input, context }) => (await execute(input, context.principal, context.token, context.ip)).map(user => toPackedUserDetailed(user)));
}
