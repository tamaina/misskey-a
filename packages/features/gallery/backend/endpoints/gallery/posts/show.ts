/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedGalleryPostsShowDefinition, packedGalleryPostsShowInput, packedGalleryPostsShowOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { GalleryPostsRepository } from '@/models/_.js';
import { GalleryPostEntityService } from '../../../serializers/GalleryPostEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedGalleryPostsShowDefinition);

export const meta = {
	tags: ['gallery'],

	requireCredential: false,

	errors: {
		noSuchPost: {
			message: 'No such post.',
			code: 'NO_SUCH_POST',
			id: '1137bf14-c5b0-4604-85bb-5b5371b1cd45',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedGalleryPostsShowInput, typeof packedGalleryPostsShowOutput> {
	constructor(
		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,

		private galleryPostEntityService: GalleryPostEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const post = await this.galleryPostsRepository.findOneBy({
				id: ps.postId,
			});

			if (post == null) {
				throw new ApiError(meta.errors.noSuchPost);
			}

			return await this.galleryPostEntityService.pack(post, me);
		});
	}
}
