/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import type { PageLikesRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { PageLikeEntityService } from '../../serializers/PageLikeEntityService.js';
import { DI } from '@/di-symbols.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import { iPageLikesInput } from '../../endpoints/i/page-likes.contract.js';

@Injectable()
export class IPageLikesApplicationService {
	constructor(
		@Inject(DI.pageLikesRepository)
		private pageLikesRepository: PageLikesRepository,

		private pageLikeEntityService: PageLikeEntityService,
		private queryService: QueryService,
	) {}

	async execute(ps: v.InferOutput<typeof iPageLikesInput>, me: MiLocalUser) {
		const query = this.queryService.makePaginationQuery(this.pageLikesRepository.createQueryBuilder('like'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('like.userId = :meId', { meId: me.id })
			.leftJoinAndSelect('like.page', 'page');

		const likes = await query
			.limit(ps.limit)
			.getMany();

		return this.pageLikeEntityService.packMany(likes, me);
	}
}
