/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { FollowingsRepository } from '../../../../persistence/backend/repositories/models.js';
import { QueryService } from '../../../../notes/backend/services/QueryService.js';
import { FollowingEntityService } from '../../../../relationships/backend/serializers/FollowingEntityService.js';
import { RoleService } from '../../../../roles/backend/services/RoleService.js';
import { DI } from '@/di-symbols.js';
import type { MiUser } from '../../../../users/backend/models/User.js';
import * as v from 'valibot';
import type { FederationFollowersInput, FederationFollowersOutput } from './followers.contract.js';
import { federationFollowersContract } from './followers.contract.js';

@Injectable()
export class FederationFollowersApplicationService {
	constructor(
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private followingEntityService: FollowingEntityService,
		private queryService: QueryService,
		private roleService: RoleService,
	) {}

	public async execute(ps: FederationFollowersInput, me: MiUser | null): Promise<FederationFollowersOutput> {
		const result = await (async () => {
			const query = this.queryService.makePaginationQuery(this.followingsRepository.createQueryBuilder('following'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('following.followeeHost = :host', { host: ps.host })
				.andWhere('following.isFollowerSuspended = false');

			if (!await this.roleService.isModerator(me)) {
				this.queryService.generateFollowingRelationVisibilityQuery(query, 'followers', me);
			}

			const followings = await query
				.limit(ps.limit)
				.getMany();

			return await this.followingEntityService.packMany(followings, me, { populateFollowee: true });
		})();
		return v.parse(federationFollowersContract['~orpc'].outputSchema!, result);
	}
}
