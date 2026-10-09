/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toPackedPage } from '@features/users/backend/page.schema.js';

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { requirePrincipal } from '../../../../api/backend/transport/middleware.js';

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
	return createApiProcedure<MiLocalUser>()(iPageLikesContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.pageLikesRepository.createQueryBuilder('like'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('like.userId = :meId', { meId: me.id })
				.leftJoinAndSelect('like.page', 'page');
			const likes = await query
				.limit(ps.limit)
				.getMany();
			return (await deps.pageLikeEntityService.packMany(likes, me)).map(like => ({ id: like.id, page: toPackedPage(like.page) }));
		});
}
