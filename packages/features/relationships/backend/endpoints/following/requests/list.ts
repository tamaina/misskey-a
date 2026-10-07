/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedFollowingRequestsListDefinition, packedFollowingRequestsListInput, packedFollowingRequestsListOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { FollowRequestsRepository } from '@/models/_.js';
import { FollowRequestEntityService } from '../../../serializers/FollowRequestEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedFollowingRequestsListDefinition);

export const meta = {
	tags: ['following', 'account'],

	requireCredential: true,

	kind: 'read:following',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedFollowingRequestsListInput, typeof packedFollowingRequestsListOutput> {
	constructor(
		@Inject(DI.followRequestsRepository)
		private followRequestsRepository: FollowRequestsRepository,

		private followRequestEntityService: FollowRequestEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.followRequestsRepository.createQueryBuilder('request'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('request.followeeId = :meId', { meId: me.id });

			const requests = await query
				.limit(ps.limit)
				.getMany();

			return await this.followRequestEntityService.packMany(requests, me);
		});
	}
}
