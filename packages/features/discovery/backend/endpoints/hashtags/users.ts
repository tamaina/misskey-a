/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { safeForSql } from '@features/persistence/backend/utility/safe-for-sql.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { normalizeForSearch } from '../../utility/normalize-for-search.js';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { ApiContext } from '@features/api/backend/transport/context.js';
import { discoveryContract, type DiscoveryInputs } from '../discovery.contract.js';
import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
export interface HashtagsUsersDependencies {
	usersRepository: UsersRepository;
	userEntityService: UserEntityService;
}
export function createHashtagsUsersProcedure<Actor extends MiLocalUser>(deps: HashtagsUsersDependencies) {
	const handler = async ({ input: ps, context: { principal: me } }: { input: DiscoveryInputs['hashtags/users']; context: ApiContext<Actor> & { principal: Actor | null } }) => {
		if (!safeForSql(normalizeForSearch(ps.tag))) throw new Error('Injection');
		const query = deps.usersRepository.createQueryBuilder('user')
			.where(':tag <@ user.tags', { tag: [normalizeForSearch(ps.tag)] })
			.andWhere('user.isSuspended = FALSE')
			.andWhere('user.isRemoteSuspended = FALSE');

		const recent = new Date(Date.now() - (1000 * 60 * 60 * 24 * 5));

		if (ps.state === 'alive') {
			query.andWhere('user.updatedAt > :date', { date: recent });
		}

		if (ps.origin === 'local') {
			query.andWhere('user.host IS NULL');
		} else if (ps.origin === 'remote') {
			query.andWhere('user.host IS NOT NULL');
		}

		switch (ps.sort) {
			case '+follower': query.orderBy('user.followersCount', 'DESC'); break;
			case '-follower': query.orderBy('user.followersCount', 'ASC'); break;
			case '+createdAt': query.orderBy('user.id', 'DESC'); break;
			case '-createdAt': query.orderBy('user.id', 'ASC'); break;
			case '+updatedAt': query.orderBy('user.updatedAt', 'DESC'); break;
			case '-updatedAt': query.orderBy('user.updatedAt', 'ASC'); break;
		}

		const users = await query
			.limit(ps.limit)
			.offset(ps.offset)
			.getMany();
		return (await deps.userEntityService.packMany(users, me, { schema: 'UserDetailed' })).map(user => toPackedUserDetailed(user));
	};
	return createApiProcedure<Actor>()(discoveryContract['hashtags/users']).handler(handler);
}
