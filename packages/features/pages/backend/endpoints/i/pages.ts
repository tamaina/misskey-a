/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import { iPagesContract } from './pages.contract.js';
import type { PagesRepository } from '@features/persistence/backend/repositories/models.js';
import type { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { PageEntityService } from '../../serializers/PageEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface IPagesDependencies {
	pagesRepository: Pick<PagesRepository, 'createQueryBuilder'>;
	pageEntityService: Pick<PageEntityService, 'packMany'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
}
export function createIPagesProcedure(deps: IPagesDependencies) {
	return implement(iPagesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: iPagesContract['~orpc'].meta.requestName, requireCredential: true, kind: 'read:pages' }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.pagesRepository.createQueryBuilder('page'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('page.userId = :meId', { meId: me.id });
			const pages = await query
				.limit(ps.limit)
				.getMany();
			return await deps.pageEntityService.packMany(pages);
		});
}
