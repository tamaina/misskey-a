/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DI } from '@/di-symbols.js';
import { FollowRequestEntityService } from '../../../serializers/FollowRequestEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { RelationshipsInputs } from '../../relationships.contract.js';

import type { FollowRequestsRepository } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class FollowingRequestsListOperation {
	constructor(
		@Inject(DI.followRequestsRepository)
		private followRequestsRepository: FollowRequestsRepository,

		private followRequestEntityService: FollowRequestEntityService,
		private queryService: QueryService,
	) {}

	async execute(ps: RelationshipsInputs['following/requests/list'], me: MiLocalUser) {
		const query = this.queryService.makePaginationQuery(this.followRequestsRepository.createQueryBuilder('request'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('request.followeeId = :meId', { meId: me.id });

		const requests = await query
			.limit(ps.limit)
			.getMany();

		return await this.followRequestEntityService.packMany(requests, me);
	}
}
