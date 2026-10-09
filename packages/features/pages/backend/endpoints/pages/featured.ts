/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import { pagesFeaturedContract } from './featured.contract.js';
import type { PagesRepository } from '@features/persistence/backend/repositories/models.js';
import type { PageEntityService } from '../../serializers/PageEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface PagesFeaturedDependencies {
	pagesRepository: Pick<PagesRepository, 'createQueryBuilder'>;
	pageEntityService: Pick<PageEntityService, 'packMany'>;
}
export function createPagesFeaturedProcedure(deps: PagesFeaturedDependencies) {
	return implement(pagesFeaturedContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: pagesFeaturedContract['~orpc'].meta.requestName }))
		.handler(async ({ context }) => {
			const me = context.principal;
			const query = deps.pagesRepository.createQueryBuilder('page')
				.where('page.visibility = \'public\'')
				.andWhere('page.likedCount > 0')
				.orderBy('page.likedCount', 'DESC');
			const pages = await query.limit(10).getMany();
			return await deps.pageEntityService.packMany(pages, me);
		});
}
