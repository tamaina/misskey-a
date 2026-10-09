/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import type { PagesRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { PageEntityService } from '../../serializers/PageEntityService.js';
import { DI } from '@/di-symbols.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { InferSchemaOutput } from '@orpc/contract';
import { type iPagesContract } from '../../endpoints/i/pages.contract.js';

@Injectable()
export class IPagesApplicationService {
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		private pageEntityService: PageEntityService,
		private queryService: QueryService,
	) {}

	async execute(ps: InferSchemaOutput<NonNullable<(typeof iPagesContract)['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const query = this.queryService.makePaginationQuery(this.pagesRepository.createQueryBuilder('page'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('page.userId = :meId', { meId: me.id });

		const pages = await query
			.limit(ps.limit)
			.getMany();

		return await this.pageEntityService.packMany(pages);
	}
}
