/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toPackedFollowRequest } from '../../relationships.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { relationshipsContract } from '../../relationships.contract.js';
import type { RelationshipsDependencies } from '../../../api.implementation.js';
export function createFollowingRequestsListProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'queryService' | 'followRequestsRepository' | 'followRequestEntityService'>) {
	return createApiProcedure<Actor>()(relationshipsContract["following/requests/list"]).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.followRequestsRepository.createQueryBuilder('request'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('request.followeeId = :meId', { meId: me.id });

			const requests = await query
				.limit(ps.limit)
				.getMany();

			return (await deps.followRequestEntityService.packMany(requests, me)).map(toPackedFollowRequest);
		});
}
