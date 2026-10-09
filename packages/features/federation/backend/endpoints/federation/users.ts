/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import { federationUsersContract } from './users.contract.js';
import type { UsersRepository } from '../../../../persistence/backend/repositories/models.js';
import type { QueryService } from '../../../../notes/backend/services/QueryService.js';
import type { UserEntityService } from '../../../../users/backend/serializers/UserEntityService.js';
import * as v from 'valibot';
export interface FederationUsersDependencies {
	usersRepository: Pick<UsersRepository, 'createQueryBuilder'>;
	userEntityService: Pick<UserEntityService, 'packMany'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
}
export function createFederationUsersProcedure<Actor extends ApiActor>(deps: FederationUsersDependencies) {
	return implement(federationUsersContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: federationUsersContract['~orpc'].meta.requestName }))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const result = await (async () => {
				const query = deps.queryService.makePaginationQuery(deps.usersRepository.createQueryBuilder('user'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
					.andWhere('user.host = :host', { host: ps.host });
				const users = await query
					.limit(ps.limit)
					.getMany();
				return await deps.userEntityService.packMany(users, me, { schema: 'UserDetailedNotMe' });
			})();
			return v.parse(federationUsersContract['~orpc'].outputSchema!, result);
		});
}
