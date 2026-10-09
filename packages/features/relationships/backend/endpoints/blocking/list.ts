/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DI } from '@/di-symbols.js';
import { BlockingEntityService } from '../../serializers/BlockingEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { RelationshipsInputs } from '../relationships.contract.js';

import type { BlockingsRepository } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class BlockingListOperation {
	constructor(
		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		private blockingEntityService: BlockingEntityService,
		private queryService: QueryService,
	) {}

	async execute(ps: RelationshipsInputs['blocking/list'], me: MiLocalUser) {
		const query = this.queryService.makePaginationQuery(this.blockingsRepository.createQueryBuilder('blocking'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('blocking.blockerId = :meId', { meId: me.id });

		const blockings = await query
			.limit(ps.limit)
			.getMany();

		return await this.blockingEntityService.packMany(blockings, me);
	}
}
