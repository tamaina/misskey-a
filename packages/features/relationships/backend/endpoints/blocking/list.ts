/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { relationshipsContract } from '../relationships.contract.js';
import type { RelationshipsDependencies } from '../../api.implementation.js';
import { toPackedBlocking } from '../relationships.schema.js';
export function createBlockingListProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'queryService' | 'blockingsRepository' | 'blockingEntityService'>) {
	return createApiProcedure<Actor>()(relationshipsContract["blocking/list"]).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.blockingsRepository.createQueryBuilder('blocking'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('blocking.blockerId = :meId', { meId: me.id });

			const blockings = await query
				.limit(ps.limit)
				.getMany();
			return (await deps.blockingEntityService.packMany(blockings, me)).map(toPackedBlocking);
		});
}
