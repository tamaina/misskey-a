/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import { iPageLikesContract } from './page-likes.contract.js';
import type { PageLikesRepository } from '@features/persistence/backend/repositories/models.js';
import type { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { PageLikeEntityService } from '../../serializers/PageLikeEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface IPageLikesDependencies {
	pageLikesRepository: Pick<PageLikesRepository, 'createQueryBuilder'>;
	pageLikeEntityService: Pick<PageLikeEntityService, 'packMany'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
}
export function createIPageLikesProcedure(deps: IPageLikesDependencies) {
	return implement(iPageLikesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: iPageLikesContract['~orpc'].meta.requestName, requireCredential: true, kind: 'read:page-likes' }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.pageLikesRepository.createQueryBuilder('like'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('like.userId = :meId', { meId: me.id })
				.leftJoinAndSelect('like.page', 'page');
			const likes = await query
				.limit(ps.limit)
				.getMany();
			return deps.pageLikeEntityService.packMany(likes, me);
		});
}
