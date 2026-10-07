/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedChannelsFollowedDefinition, packedChannelsFollowedInput, packedChannelsFollowedOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { ChannelFollowingsRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedChannelsFollowedDefinition);

export const meta = {
	tags: ['channels', 'account'],

	requireCredential: true,

	kind: 'read:channels',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedChannelsFollowedInput, typeof packedChannelsFollowedOutput> {
	constructor(
		@Inject(DI.channelFollowingsRepository)
		private channelFollowingsRepository: ChannelFollowingsRepository,

		private channelEntityService: ChannelEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService
				.makePaginationQuery(
					this.channelFollowingsRepository.createQueryBuilder(),
					ps.sinceId,
					ps.untilId,
					ps.sinceDate,
					ps.untilDate,
					'followeeId',
				)
				.andWhere({ followerId: me.id });

			const followings = await query
				.limit(ps.limit)
				.getMany();

			return await Promise.all(followings.map(x => this.channelEntityService.pack(x.followeeId, me)));
		});
	}
}
