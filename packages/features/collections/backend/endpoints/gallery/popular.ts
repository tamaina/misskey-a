/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '@features/api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../api.definition.js';
import type { CollectionsDependencies } from '../../api.implementation.js';
export interface GalleryPopularDependencies<Actor extends ApiActor> {
	galleryPostsRepository: Pick<CollectionsDependencies<Actor>['galleryPostsRepository'], 'createQueryBuilder'>;
	galleryPostEntityService: Pick<CollectionsDependencies<Actor>['galleryPostEntityService'], 'packMany'>;
}
export function createGalleryPopularProcedure<Actor extends ApiActor>(deps: GalleryPopularDependencies<Actor>) {
	return implement(collectionsContract.galleryPopular, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: collectionsContract.galleryPopular['~orpc'].meta.requestName }))
		.handler(async ({ context }) => {
			const me = context.principal;
			const query = deps.galleryPostsRepository.createQueryBuilder('post')
				.andWhere('post.likedCount > 0')
				.orderBy('post.likedCount', 'DESC');
			const posts = await query.limit(10).getMany();
			return await deps.galleryPostEntityService.packMany(posts, me);
		});
}
