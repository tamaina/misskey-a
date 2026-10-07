/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedGalleryPostsDefinition, packedGalleryPostsInput, packedGalleryPostsOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { GalleryPostsRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { GalleryPostEntityService } from '../../serializers/GalleryPostEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedGalleryPostsDefinition);

export const meta = {
	tags: ['gallery'],

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedGalleryPostsInput, typeof packedGalleryPostsOutput> {
	constructor(
		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,

		private galleryPostEntityService: GalleryPostEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.galleryPostsRepository.createQueryBuilder('post'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.innerJoinAndSelect('post.user', 'user');

			const posts = await query.limit(ps.limit).getMany();

			return await this.galleryPostEntityService.packMany(posts, me);
		});
	}
}
