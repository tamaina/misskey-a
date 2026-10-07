/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedIGalleryLikesDefinition, packedIGalleryLikesInput, packedIGalleryLikesOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { GalleryLikesRepository } from '@/models/_.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { GalleryLikeEntityService } from '../../../serializers/GalleryLikeEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedIGalleryLikesDefinition);

export const meta = {
	tags: ['account', 'gallery'],

	requireCredential: true,

	kind: 'read:gallery-likes',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedIGalleryLikesInput, typeof packedIGalleryLikesOutput> {
	constructor(
		@Inject(DI.galleryLikesRepository)
		private galleryLikesRepository: GalleryLikesRepository,

		private galleryLikeEntityService: GalleryLikeEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.galleryLikesRepository.createQueryBuilder('like'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('like.userId = :meId', { meId: me.id })
				.leftJoinAndSelect('like.post', 'post');

			const likes = await query
				.limit(ps.limit)
				.getMany();

			return await this.galleryLikeEntityService.packMany(likes, me);
		});
	}
}
