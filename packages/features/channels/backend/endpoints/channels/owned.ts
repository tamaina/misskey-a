/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedChannelsOwnedDefinition, packedChannelsOwnedInput, packedChannelsOwnedOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { ChannelsRepository } from '@/models/_.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedChannelsOwnedDefinition);

export const meta = {
	tags: ['channels', 'account'],

	requireCredential: true,

	kind: 'read:channels',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedChannelsOwnedInput, typeof packedChannelsOwnedOutput> {
	constructor(
		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		private channelEntityService: ChannelEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.channelsRepository.createQueryBuilder('channel'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('channel.isArchived = FALSE')
				.andWhere({ userId: me.id });

			const channels = await query
				.limit(ps.limit)
				.getMany();

			return await Promise.all(channels.map(x => this.channelEntityService.pack(x, me)));
		});
	}
}
