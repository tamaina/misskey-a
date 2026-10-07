/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidGalleryPostsUnlikeDefinition, voidGalleryPostsUnlikeInput, voidGalleryPostsUnlikeOutput } from '../../../../contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { GalleryPostsRepository, GalleryLikesRepository } from '@/models/_.js';
import { FeaturedService, GALLERY_POSTS_RANKING_WINDOW } from '@features/discovery/backend/services/FeaturedService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(voidGalleryPostsUnlikeDefinition);

export const meta = {
	tags: ['gallery'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:gallery-likes',

	errors: {
		noSuchPost: {
			message: 'No such post.',
			code: 'NO_SUCH_POST',
			id: 'c32e6dd0-b555-4413-925e-b3757d19ed84',
		},

		notLiked: {
			message: 'You have not liked that post.',
			code: 'NOT_LIKED',
			id: 'e3e8e06e-be37-41f7-a5b4-87a8250288f0',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidGalleryPostsUnlikeInput, typeof voidGalleryPostsUnlikeOutput> {
	constructor(
		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,

		@Inject(DI.galleryLikesRepository)
		private galleryLikesRepository: GalleryLikesRepository,

		private featuredService: FeaturedService,
		private idService: IdService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const post = await this.galleryPostsRepository.findOneBy({ id: ps.postId });
			if (post == null) {
				throw new ApiError(meta.errors.noSuchPost);
			}

			const exist = await this.galleryLikesRepository.findOneBy({
				postId: post.id,
				userId: me.id,
			});

			if (exist == null) {
				throw new ApiError(meta.errors.notLiked);
			}

			// Delete like
			await this.galleryLikesRepository.delete(exist.id);

			// ランキング更新
			if (Date.now() - this.idService.parse(post.id).date.getTime() < GALLERY_POSTS_RANKING_WINDOW) {
				await this.featuredService.updateGalleryPostsRanking(post.id, -1);
			}

			this.galleryPostsRepository.decrement({ id: post.id }, 'likedCount', 1);
		});
	}
}
