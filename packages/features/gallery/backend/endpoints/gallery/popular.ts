/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedGalleryPopularDefinition, packedGalleryPopularInput, packedGalleryPopularOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { GalleryPostsRepository } from '@/models/_.js';
import { GalleryPostEntityService } from '../../serializers/GalleryPostEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedGalleryPopularDefinition);

export const meta = {
	tags: ['gallery'],

	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedGalleryPopularInput, typeof packedGalleryPopularOutput> {
	constructor(
		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,

		private galleryPostEntityService: GalleryPostEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.galleryPostsRepository.createQueryBuilder('post')
				.andWhere('post.likedCount > 0')
				.orderBy('post.likedCount', 'DESC');

			const posts = await query.limit(10).getMany();

			return await this.galleryPostEntityService.packMany(posts, me);
		});
	}
}
