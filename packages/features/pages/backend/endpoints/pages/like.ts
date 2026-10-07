/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidPagesLikeDefinition, voidPagesLikeInput, voidPagesLikeOutput } from '../../../contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { PagesRepository, PageLikesRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';

import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(voidPagesLikeDefinition);

export const meta = {
	tags: ['pages'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:page-likes',

	errors: {
		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: 'cc98a8a2-0dc3-4123-b198-62c71df18ed3',
		},

		yourPage: {
			message: 'You cannot like your page.',
			code: 'YOUR_PAGE',
			id: '28800466-e6db-40f2-8fae-bf9e82aa92b8',
		},

		alreadyLiked: {
			message: 'The page has already been liked.',
			code: 'ALREADY_LIKED',
			id: 'd4c1edbe-7da2-4eae-8714-1acfd2d63941',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidPagesLikeInput, typeof voidPagesLikeOutput> {
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		@Inject(DI.pageLikesRepository)
		private pageLikesRepository: PageLikesRepository,

		private idService: IdService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const page = await this.pagesRepository.findOneBy({ id: ps.pageId });
			if (page == null) {
				throw new ApiError(meta.errors.noSuchPage);
			}

			if (page.userId === me.id) {
				throw new ApiError(meta.errors.yourPage);
			}

			// if already liked
			const exist = await this.pageLikesRepository.exists({
				where: {
					pageId: page.id,
					userId: me.id,
				},
			});

			if (exist) {
				throw new ApiError(meta.errors.alreadyLiked);
			}

			// Create like
			await this.pageLikesRepository.insert({
				id: this.idService.gen(),
				pageId: page.id,
				userId: me.id,
			});

			this.pagesRepository.increment({ id: page.id }, 'likedCount', 1);
		});
	}
}
