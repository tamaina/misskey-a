/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedFederationFollowersDefinition, packedFederationFollowersInput, packedFederationFollowersOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { FollowingsRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { FollowingEntityService } from '@features/relationships/backend/serializers/FollowingEntityService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedFederationFollowersDefinition);

export const meta = {
	tags: ['federation'],

	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedFederationFollowersInput, typeof packedFederationFollowersOutput> {
	constructor(
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private followingEntityService: FollowingEntityService,
		private queryService: QueryService,
		private roleService: RoleService,
	) {
		super(meta, contractProjection, async (ps, me) => {
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
		});
	}
}
