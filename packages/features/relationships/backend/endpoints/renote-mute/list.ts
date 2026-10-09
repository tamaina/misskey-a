/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DI } from '@/di-symbols.js';
import { RenoteMutingEntityService } from '../../serializers/RenoteMutingEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { RelationshipsInputs } from '../relationships.contract.js';

import type { RenoteMutingsRepository } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class RenoteMuteListOperation {
	constructor(
		@Inject(DI.renoteMutingsRepository)
		private renoteMutingsRepository: RenoteMutingsRepository,

		private renoteMutingEntityService: RenoteMutingEntityService,
		private queryService: QueryService,
	) {}

	async execute(ps: RelationshipsInputs['renote-mute/list'], me: MiLocalUser) {
		const query = this.queryService.makePaginationQuery(this.renoteMutingsRepository.createQueryBuilder('muting'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('muting.muterId = :meId', { meId: me.id });

		const mutings = await query
			.limit(ps.limit)
			.getMany();

		return await this.renoteMutingEntityService.packMany(mutings, me);
	}
}
