/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { relationshipsContract } from '../relationships.contract.js';
import type { RelationshipsDependencies } from '../../api.implementation.js';
import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
export function createBlockingListProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'queryService' | 'blockingsRepository' | 'blockingEntityService'>) {
	return implement(relationshipsContract["blocking/list"], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'blocking/list', requireCredential: true, kind: 'read:blocks' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.blockingsRepository.createQueryBuilder('blocking'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('blocking.blockerId = :meId', { meId: me.id });

			const blockings = await query
				.limit(ps.limit)
				.getMany();
			return (await deps.blockingEntityService.packMany(blockings, me)).map(row => ({ ...row, blockee: toPackedUserDetailed(row.blockee) }));
		});
}
