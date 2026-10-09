/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { relationshipsContract } from '../relationships.contract.js';
import type { RelationshipsDependencies } from '../../api.implementation.js';
import { toPackedRenoteMuting } from '../relationships.schema.js';
export function createRenoteMuteListProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'queryService' | 'renoteMutingsRepository' | 'renoteMutingEntityService'>) {
	return createApiProcedure<Actor>()(relationshipsContract["renote-mute/list"]).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.renoteMutingsRepository.createQueryBuilder('muting'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('muting.muterId = :meId', { meId: me.id });

			const mutings = await query
				.limit(ps.limit)
				.getMany();
			return (await deps.renoteMutingEntityService.packMany(mutings, me)).map(toPackedRenoteMuting);
		});
}
