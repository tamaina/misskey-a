/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../../api.definition.js';
import type { CollectionsDependencies } from '../../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { GALLERY_POSTS_RANKING_WINDOW } from '@features/discovery/backend/services/FeaturedService.js';
import { collectionsErrors } from '../../../api.errors.js';
export interface GalleryPostsUnlikeDependencies<Actor extends ApiActor> {
	galleryPostsRepository: Pick<CollectionsDependencies<Actor>['galleryPostsRepository'], 'decrement' | 'findOneBy'>;
	galleryLikesRepository: Pick<CollectionsDependencies<Actor>['galleryLikesRepository'], 'delete' | 'findOneBy'>;
	idService: Pick<CollectionsDependencies<Actor>['idService'], 'parse'>;
	featuredService: Pick<CollectionsDependencies<Actor>['featuredService'], 'updateGalleryPostsRanking'>;
}
export function createGalleryPostsUnlikeProcedure<Actor extends ApiActor>(deps: GalleryPostsUnlikeDependencies<Actor>) {
	return createApiProcedure<Actor>()(collectionsContract.galleryPostsUnlike).use(requirePrincipal<Actor>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const post = await deps.galleryPostsRepository.findOneBy({ id: ps.postId });
			if (post == null) {
				throw apiError(collectionsErrors.galleryPostsUnlike.noSuchPost);
			}
			const exist = await deps.galleryLikesRepository.findOneBy({
				postId: post.id,
				userId: me.id,
			});
			if (exist == null) {
				throw apiError(collectionsErrors.galleryPostsUnlike.notLiked);
			}
			// Delete like
			await deps.galleryLikesRepository.delete(exist.id);
			// ランキング更新
			if (Date.now() - deps.idService.parse(post.id).date.getTime() < GALLERY_POSTS_RANKING_WINDOW) {
				await deps.featuredService.updateGalleryPostsRanking(post.id, -1);
			}
			deps.galleryPostsRepository.decrement({ id: post.id }, 'likedCount', 1);
		});
}
