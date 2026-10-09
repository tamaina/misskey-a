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
export function createRenoteMuteListProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'queryService' | 'renoteMutingsRepository' | 'renoteMutingEntityService'>) {
	return implement(relationshipsContract["renote-mute/list"], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'renote-mute/list', requireCredential: true, kind: 'read:mutes' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.renoteMutingsRepository.createQueryBuilder('muting'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('muting.muterId = :meId', { meId: me.id });

			const mutings = await query
				.limit(ps.limit)
				.getMany();
			return (await deps.renoteMutingEntityService.packMany(mutings, me)).map(row => ({ ...row, mutee: toPackedUserDetailed(row.mutee) }));
		});
}
