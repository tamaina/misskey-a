/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toPackedPage } from '@features/users/backend/page.schema.js';

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { requirePrincipal } from '../../../../api/backend/transport/middleware.js';

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
	return createApiProcedure<MiLocalUser>()(iPagesContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.pagesRepository.createQueryBuilder('page'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('page.userId = :meId', { meId: me.id });
			const pages = await query
				.limit(ps.limit)
				.getMany();
			return (await deps.pageEntityService.packMany(pages)).map(toPackedPage);
		});
}
