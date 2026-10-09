/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { PagesRepository, PageLikesRepository } from '@features/persistence/backend/repositories/models.js';

import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { InferSchemaOutput } from '@orpc/contract';
import { type pagesUnlikeContract, pagesUnlikeErrors } from '../../endpoints/pages/unlike.contract.js';

@Injectable()
export class PagesUnlikeApplicationService {
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		@Inject(DI.pageLikesRepository)
		private pageLikesRepository: PageLikesRepository,
	) {}

	async execute(ps: InferSchemaOutput<NonNullable<(typeof pagesUnlikeContract)['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const page = await this.pagesRepository.findOneBy({ id: ps.pageId });
		if (page == null) {
			throw apiError(pagesUnlikeErrors.noSuchPage);
		}

		const exist = await this.pageLikesRepository.findOneBy({
			pageId: page.id,
			userId: me.id,
		});

		if (exist == null) {
			throw apiError(pagesUnlikeErrors.notLiked);
		}

		// Delete like
		await this.pageLikesRepository.delete(exist.id);

		this.pagesRepository.decrement({ id: page.id }, 'likedCount', 1);
	}
}
