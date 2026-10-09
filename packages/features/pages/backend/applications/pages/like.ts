/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { PagesRepository, PageLikesRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';

import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import { pagesLikeInput, pagesLikeErrors } from '../../endpoints/pages/like.contract.js';

@Injectable()
export class PagesLikeApplicationService {
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		@Inject(DI.pageLikesRepository)
		private pageLikesRepository: PageLikesRepository,

		private idService: IdService,
	) {}

	async execute(ps: v.InferOutput<typeof pagesLikeInput>, me: MiLocalUser) {
		const page = await this.pagesRepository.findOneBy({ id: ps.pageId });
		if (page == null) {
			throw apiError(pagesLikeErrors.noSuchPage);
		}

		if (page.userId === me.id) {
			throw apiError(pagesLikeErrors.yourPage);
		}

		// if already liked
		const exist = await this.pageLikesRepository.exists({
			where: {
				pageId: page.id,
				userId: me.id,
			},
		});

		if (exist) {
			throw apiError(pagesLikeErrors.alreadyLiked);
		}

		// Create like
		await this.pageLikesRepository.insert({
			id: this.idService.gen(),
			pageId: page.id,
			userId: me.id,
		});

		this.pagesRepository.increment({ id: page.id }, 'likedCount', 1);
	}
}
