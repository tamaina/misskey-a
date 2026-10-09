/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../../api.definition.js';
import type { CollectionsDependencies } from '../../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { GALLERY_POSTS_RANKING_WINDOW } from '@features/discovery/backend/services/FeaturedService.js';
import { collectionsErrors } from '../../../api.errors.js';
export interface GalleryPostsLikeDependencies<Actor extends ApiActor> {
	galleryPostsRepository: Pick<CollectionsDependencies<Actor>['galleryPostsRepository'], 'findOneBy' | 'increment'>;
	galleryLikesRepository: Pick<CollectionsDependencies<Actor>['galleryLikesRepository'], 'exists' | 'insert'>;
	idService: Pick<CollectionsDependencies<Actor>['idService'], 'gen' | 'parse'>;
	featuredService: Pick<CollectionsDependencies<Actor>['featuredService'], 'updateGalleryPostsRanking'>;
}
export function createGalleryPostsLikeProcedure<Actor extends ApiActor>(deps: GalleryPostsLikeDependencies<Actor>) {
	return implement(collectionsContract.galleryPostsLike, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: collectionsContract.galleryPostsLike['~orpc'].meta.requestName, requireCredential: true, prohibitMoved: true, kind: 'write:gallery-likes' })).use(requirePrincipal<Actor>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const post = await deps.galleryPostsRepository.findOneBy({ id: ps.postId });
			if (post == null) {
				throw apiError(collectionsErrors.galleryPostsLike.noSuchPost);
			}
			if (post.userId === me.id) {
				throw apiError(collectionsErrors.galleryPostsLike.yourPost);
			}
			// if already liked
			const exist = await deps.galleryLikesRepository.exists({
				where: {
					postId: post.id,
					userId: me.id,
				},
			});
			if (exist) {
				throw apiError(collectionsErrors.galleryPostsLike.alreadyLiked);
			}
			// Create like
			await deps.galleryLikesRepository.insert({
				id: deps.idService.gen(),
				postId: post.id,
				userId: me.id,
			});
			// ランキング更新
			if (Date.now() - deps.idService.parse(post.id).date.getTime() < GALLERY_POSTS_RANKING_WINDOW) {
				await deps.featuredService.updateGalleryPostsRanking(post.id, 1);
			}
			deps.galleryPostsRepository.increment({ id: post.id }, 'likedCount', 1);
		});
}
