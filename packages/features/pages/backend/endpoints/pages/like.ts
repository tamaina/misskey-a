/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { requirePrincipal } from '../../../../api/backend/transport/middleware.js';

import { pagesLikeContract, pagesLikeErrors } from './like.contract.js';
import type { PagesRepository, PageLikesRepository } from '@features/persistence/backend/repositories/models.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface PagesLikeDependencies {
	pagesRepository: Pick<PagesRepository, 'findOneBy' | 'increment'>;
	pageLikesRepository: Pick<PageLikesRepository, 'exists' | 'insert'>;
	idService: Pick<IdService, 'gen'>;
}
export function createPagesLikeProcedure(deps: PagesLikeDependencies) {
	return createApiProcedure<MiLocalUser>()(pagesLikeContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const page = await deps.pagesRepository.findOneBy({ id: ps.pageId });
			if (page == null) {
				throw apiError(pagesLikeErrors.noSuchPage);
			}
			if (page.userId === me.id) {
				throw apiError(pagesLikeErrors.yourPage);
			}
			// if already liked
			const exist = await deps.pageLikesRepository.exists({
				where: {
					pageId: page.id,
					userId: me.id,
				},
			});
			if (exist) {
				throw apiError(pagesLikeErrors.alreadyLiked);
			}
			// Create like
			await deps.pageLikesRepository.insert({
				id: deps.idService.gen(),
				pageId: page.id,
				userId: me.id,
			});
			deps.pagesRepository.increment({ id: page.id }, 'likedCount', 1);
		});
}
