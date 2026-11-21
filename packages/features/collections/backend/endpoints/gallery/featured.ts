/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedGalleryPost } from '../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../api.definition.js';
import type { CollectionsDependencies } from '../../api.implementation.js';
export interface GalleryFeaturedDependencies<Actor extends ApiActor> {
	featuredService: Pick<CollectionsDependencies<Actor>['featuredService'], 'getGalleryPostsRanking'>;
	galleryPostsRepository: Pick<CollectionsDependencies<Actor>['galleryPostsRepository'], 'createQueryBuilder'>;
	galleryPostEntityService: Pick<CollectionsDependencies<Actor>['galleryPostEntityService'], 'packMany'>;
}
export function createGalleryFeaturedProcedure<Actor extends ApiActor>(deps: GalleryFeaturedDependencies<Actor>) {
	// Shared by all requests through this composed endpoint.
	let galleryPostsRankingCache: string[] = [];
	let galleryPostsRankingCacheLastFetchedAt = 0;
	return createApiProcedure<Actor>()(collectionsContract.galleryFeatured).use(decodeScalarInput<Actor>({ limit: 'integer' }))
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			let postIds: string[];
			if (galleryPostsRankingCacheLastFetchedAt !== 0 && (Date.now() - galleryPostsRankingCacheLastFetchedAt < 1000 * 60 * 30)) {
				postIds = galleryPostsRankingCache;
			} else {
				postIds = await deps.featuredService.getGalleryPostsRanking(100);
				galleryPostsRankingCache = postIds;
				galleryPostsRankingCacheLastFetchedAt = Date.now();
			}
			postIds.sort((a, b) => a > b ? -1 : 1);
			const untilId = ps.untilId;
			if (untilId) {
				postIds = postIds.filter(id => id < untilId);
			}
			postIds = postIds.slice(0, ps.limit);
			if (postIds.length === 0) {
				return [];
			}
			const query = deps.galleryPostsRepository.createQueryBuilder('post')
				.where('post.id IN (:...postIds)', { postIds: postIds });
			const posts = await query.getMany();
			return (await deps.galleryPostEntityService.packMany(posts, me)).map(toPackedGalleryPost);
		});
}
