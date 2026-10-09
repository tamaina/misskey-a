/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DI } from '@/di-symbols.js';
import { MutingEntityService } from '../../serializers/MutingEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { RelationshipsInputs } from '../relationships.contract.js';

import type { MutingsRepository } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class MuteListOperation {
	constructor(
		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		private mutingEntityService: MutingEntityService,
		private queryService: QueryService,
	) {}

	async execute(ps: RelationshipsInputs['mute/list'], me: MiLocalUser) {
		const query = this.queryService.makePaginationQuery(this.mutingsRepository.createQueryBuilder('muting'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('muting.muterId = :meId', { meId: me.id });

		const mutings = await query
			.limit(ps.limit)
			.getMany();

		return await this.mutingEntityService.packMany(mutings, me);
	}
}
