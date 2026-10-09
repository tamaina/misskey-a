/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { PageEntityService } from '../../serializers/PageEntityService.js';
import type { PagesRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { InferSchemaOutput } from '@orpc/contract';
import { type usersPagesContract } from '../../endpoints/users/pages.contract.js';

@Injectable()
export class UsersPagesApplicationService {
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		private pageEntityService: PageEntityService,
		private queryService: QueryService,
	) {}

	async execute(ps: InferSchemaOutput<NonNullable<(typeof usersPagesContract)['~orpc']['inputSchema']>>, me: MiLocalUser | null) {
		const query = this.queryService.makePaginationQuery(this.pagesRepository.createQueryBuilder('page'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('page.userId = :userId', { userId: ps.userId })
			.andWhere('page.visibility = \'public\'');

		const pages = await query
			.limit(ps.limit)
			.getMany();

		return await this.pageEntityService.packMany(pages);
	}
}
