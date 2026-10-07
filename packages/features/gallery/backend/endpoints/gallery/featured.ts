/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedGalleryFeaturedDefinition, packedGalleryFeaturedInput, packedGalleryFeaturedOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { GalleryPostsRepository } from '@features/persistence/backend/repositories/models.js';
import { GalleryPostEntityService } from '../../serializers/GalleryPostEntityService.js';
import { DI } from '@/di-symbols.js';
import { FeaturedService } from '@features/discovery/backend/services/FeaturedService.js';

const contractProjection = projectEndpointContract(packedGalleryFeaturedDefinition);

export const meta = {
	tags: ['gallery'],

	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedGalleryFeaturedInput, typeof packedGalleryFeaturedOutput> {
	private galleryPostsRankingCache: string[] = [];
	private galleryPostsRankingCacheLastFetchedAt = 0;

	constructor(
		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,

		private galleryPostEntityService: GalleryPostEntityService,
		private featuredService: FeaturedService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			let postIds: string[];
			if (this.galleryPostsRankingCacheLastFetchedAt !== 0 && (Date.now() - this.galleryPostsRankingCacheLastFetchedAt < 1000 * 60 * 30)) {
				postIds = this.galleryPostsRankingCache;
			} else {
				postIds = await this.featuredService.getGalleryPostsRanking(100);
				this.galleryPostsRankingCache = postIds;
				this.galleryPostsRankingCacheLastFetchedAt = Date.now();
			}

			postIds.sort((a, b) => a > b ? -1 : 1);
			if (ps.untilId) {
				postIds = postIds.filter(id => id < ps.untilId!);
			}
			postIds = postIds.slice(0, ps.limit);

			if (postIds.length === 0) {
				return [];
			}

			const query = this.galleryPostsRepository.createQueryBuilder('post')
				.where('post.id IN (:...postIds)', { postIds: postIds });

			const posts = await query.getMany();

			return await this.galleryPostEntityService.packMany(posts, me);
		});
	}
}
