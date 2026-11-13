/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedGalleryPost } from '../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../api.definition.js';
import type { CollectionsDependencies } from '../../api.implementation.js';
export interface GalleryPopularDependencies<Actor extends ApiActor> {
	galleryPostsRepository: Pick<CollectionsDependencies<Actor>['galleryPostsRepository'], 'createQueryBuilder'>;
	galleryPostEntityService: Pick<CollectionsDependencies<Actor>['galleryPostEntityService'], 'packMany'>;
}
export function createGalleryPopularProcedure<Actor extends ApiActor>(deps: GalleryPopularDependencies<Actor>) {
	return createApiProcedure<Actor>()(collectionsContract.galleryPopular)
		.handler(async ({ context }) => {
			const me = context.principal;
			const query = deps.galleryPostsRepository.createQueryBuilder('post')
				.andWhere('post.likedCount > 0')
				.orderBy('post.likedCount', 'DESC');
			const posts = await query.limit(10).getMany();
			return (await deps.galleryPostEntityService.packMany(posts, me)).map(toPackedGalleryPost);
		});
}
