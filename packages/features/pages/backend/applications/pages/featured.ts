/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { PagesRepository } from '@features/persistence/backend/repositories/models.js';

import { PageEntityService } from '../../serializers/PageEntityService.js';
import { DI } from '@/di-symbols.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import { pagesFeaturedInput } from '../../endpoints/pages/featured.contract.js';

@Injectable()
export class PagesFeaturedApplicationService {
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		private pageEntityService: PageEntityService,
	) {}

	async execute(ps: v.InferOutput<typeof pagesFeaturedInput>, me: MiLocalUser | null) {
		const query = this.pagesRepository.createQueryBuilder('page')
			.where('page.visibility = \'public\'')
			.andWhere('page.likedCount > 0')
			.orderBy('page.likedCount', 'DESC');

		const pages = await query.limit(10).getMany();

		return await this.pageEntityService.packMany(pages, me);
	}
}
