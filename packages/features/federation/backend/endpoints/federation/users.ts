/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { ApiActor } from '../../../../api/backend/transport/context.js';
import { federationUsersContract } from './users.contract.js';
import type { UsersRepository } from '../../../../persistence/backend/repositories/models.js';
import type { QueryService } from '../../../../notes/backend/services/QueryService.js';
import type { UserEntityService } from '../../../../users/backend/serializers/UserEntityService.js';
export interface FederationUsersDependencies {
	usersRepository: Pick<UsersRepository, 'createQueryBuilder'>;
	userEntityService: Pick<UserEntityService, 'packMany'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
}
export function createFederationUsersProcedure<Actor extends ApiActor>(deps: FederationUsersDependencies) {
	return createApiProcedure<Actor>()(federationUsersContract)
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const result = await (async () => {
				const query = deps.queryService.makePaginationQuery(deps.usersRepository.createQueryBuilder('user'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
					.andWhere('user.host = :host', { host: ps.host });
				const users = await query
					.limit(ps.limit)
					.getMany();
				return (await deps.userEntityService.packMany(users, me, { schema: 'UserDetailedNotMe' })).map(toPackedUserDetailed);
			})();
			return result;
		});
}
