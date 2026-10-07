/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedFollowingListDefinition, packedFollowingListInput, packedFollowingListOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { FollowingEntityService } from '../../serializers/FollowingEntityService.js';
import type { FollowingsRepository } from '@features/persistence/backend/repositories/models.js';

import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedFollowingListDefinition);

export const meta = {
	tags: ['users'],

	requireCredential: true,
	kind: 'read:following',
	description: 'List of following users',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedFollowingListInput, typeof packedFollowingListOutput> {
	constructor(
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private followingEntityService: FollowingEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.followingsRepository.createQueryBuilder('following'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('following.followerId = :userId', { userId: me.id });

			if (ps.notification) {
				query.andWhere('following.notify IS NOT NULL');
			}

			query.innerJoinAndSelect('following.followee', 'followee');

			const followings = await query
				.limit(ps.limit)
				.getMany();

			return await this.followingEntityService.packMany(followings, me, { populateFollowee: true });
		});
	}
}
