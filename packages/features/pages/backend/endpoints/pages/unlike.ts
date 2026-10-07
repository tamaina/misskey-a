/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { voidPagesUnlikeDefinition, voidPagesUnlikeInput, voidPagesUnlikeOutput } from '../../../contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { PagesRepository, PageLikesRepository } from '@/models/_.js';

import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';

const contractProjection = projectEndpointContract(voidPagesUnlikeDefinition);

export const meta = {
	tags: ['pages'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:page-likes',

	errors: {
		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: 'a0d41e20-1993-40bd-890e-f6e560ae648e',
		},

		notLiked: {
			message: 'You have not liked that page.',
			code: 'NOT_LIKED',
			id: 'f5e586b0-ce93-4050-b0e3-7f31af5259ee',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidPagesUnlikeInput, typeof voidPagesUnlikeOutput> {
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		@Inject(DI.pageLikesRepository)
		private pageLikesRepository: PageLikesRepository,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const page = await this.pagesRepository.findOneBy({ id: ps.pageId });
			if (page == null) {
				throw new ApiError(meta.errors.noSuchPage);
			}

			const exist = await this.pageLikesRepository.findOneBy({
				pageId: page.id,
				userId: me.id,
			});

			if (exist == null) {
				throw new ApiError(meta.errors.notLiked);
			}

			// Delete like
			await this.pageLikesRepository.delete(exist.id);

			this.pagesRepository.decrement({ id: page.id }, 'likedCount', 1);
		});
	}
}
