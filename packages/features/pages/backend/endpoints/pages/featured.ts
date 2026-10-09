/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toPackedPage } from '@features/users/backend/page.schema.js';

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { pagesFeaturedContract } from './featured.contract.js';
import type { PagesRepository } from '@features/persistence/backend/repositories/models.js';
import type { PageEntityService } from '../../serializers/PageEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface PagesFeaturedDependencies {
	pagesRepository: Pick<PagesRepository, 'createQueryBuilder'>;
	pageEntityService: Pick<PageEntityService, 'packMany'>;
}
export function createPagesFeaturedProcedure(deps: PagesFeaturedDependencies) {
	return createApiProcedure<MiLocalUser>()(pagesFeaturedContract)
		.handler(async ({ context }) => {
			const me = context.principal;
			const query = deps.pagesRepository.createQueryBuilder('page')
				.where('page.visibility = \'public\'')
				.andWhere('page.likedCount > 0')
				.orderBy('page.likedCount', 'DESC');
			const pages = await query.limit(10).getMany();
			return (await deps.pageEntityService.packMany(pages, me)).map(toPackedPage);
		});
}
