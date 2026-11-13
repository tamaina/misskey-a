/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { requirePrincipal } from '../../../../api/backend/transport/middleware.js';

import { pagesUnlikeContract, pagesUnlikeErrors } from './unlike.contract.js';
import type { PagesRepository, PageLikesRepository } from '@features/persistence/backend/repositories/models.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface PagesUnlikeDependencies {
	pagesRepository: Pick<PagesRepository, 'decrement' | 'findOneBy'>;
	pageLikesRepository: Pick<PageLikesRepository, 'delete' | 'findOneBy'>;
}
export function createPagesUnlikeProcedure(deps: PagesUnlikeDependencies) {
	return createApiProcedure<MiLocalUser>()(pagesUnlikeContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const page = await deps.pagesRepository.findOneBy({ id: ps.pageId });
			if (page == null) {
				throw apiError(pagesUnlikeErrors.noSuchPage);
			}
			const exist = await deps.pageLikesRepository.findOneBy({
				pageId: page.id,
				userId: me.id,
			});
			if (exist == null) {
				throw apiError(pagesUnlikeErrors.notLiked);
			}
			// Delete like
			await deps.pageLikesRepository.delete(exist.id);
			deps.pagesRepository.decrement({ id: page.id }, 'likedCount', 1);
		});
}
