/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { UsersRepository, FollowingsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import { discoveryContract, type DiscoveryInputs } from '../discovery.contract.js';
import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
export interface UsersRecommendationDependencies {
	usersRepository: UsersRepository;
	followingsRepository: FollowingsRepository;
	userEntityService: UserEntityService;
	queryService: QueryService;
}
export function createUsersRecommendationProcedure<Actor extends MiLocalUser>(deps: UsersRecommendationDependencies) {
	const handler = async ({ input: ps, context: { principal: me } }: { input: DiscoveryInputs['users/recommendation']; context: ApiContext<Actor> & { principal: Actor } }) => {
		const query = deps.usersRepository.createQueryBuilder('user')
			.where('user.isLocked = FALSE')
			.andWhere('user.isExplorable = TRUE')
			.andWhere('user.host IS NULL')
			.andWhere('user.updatedAt >= :date', { date: new Date(Date.now() - ms('7days')) })
			.andWhere('user.id != :meId', { meId: me.id })
			.orderBy('user.followersCount', 'DESC');

		deps.queryService.generateMutedUserQueryForUsers(query, me);
		deps.queryService.generateBlockQueryForUsers(query, me);
		deps.queryService.generateBlockedUserQueryForNotes(query, me);
		deps.queryService.generateBlockedUserQueryForNotes(query, me, { noteColumn: 'renote' });

		const followingQuery = deps.followingsRepository.createQueryBuilder('following')
			.select('following.followeeId')
			.where('following.followerId = :followerId', { followerId: me.id })
			.andWhere('following.isFollowerSuspended = false');

		query
			.andWhere(`user.id NOT IN (${followingQuery.getQuery()})`);
		query.setParameters(followingQuery.getParameters());

		const users = await query.limit(ps.limit).offset(ps.offset).getMany();
		return (await deps.userEntityService.packMany(users, me, { schema: 'UserDetailed' })).map(user => toPackedUserDetailed(user));
	};
	return createApiProcedure<Actor>()(discoveryContract['users/recommendation']).use(requirePrincipal<Actor>()).handler(handler);
}
