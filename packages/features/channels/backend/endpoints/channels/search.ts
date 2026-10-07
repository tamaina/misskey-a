/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedChannelsSearchDefinition, packedChannelsSearchInput, packedChannelsSearchOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';

import { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { ChannelsRepository } from '@/models/_.js';
import { ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { DI } from '@/di-symbols.js';
import { sqlLikeEscape } from '@features/persistence/backend/utility/sql-like-escape.js';

const contractProjection = projectEndpointContract(packedChannelsSearchDefinition);

export const meta = {
	tags: ['channels'],

	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedChannelsSearchInput, typeof packedChannelsSearchOutput> {
	constructor(
		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		private channelEntityService: ChannelEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.channelsRepository.createQueryBuilder('channel'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('channel.isArchived = FALSE');

			if (ps.query !== '') {
				if (ps.type === 'nameAndDescription') {
					query.andWhere(new Brackets(qb => {
						qb
							.where('channel.name ILIKE :q', { q: `%${ sqlLikeEscape(ps.query) }%` })
							.orWhere('channel.description ILIKE :q', { q: `%${ sqlLikeEscape(ps.query) }%` });
					}));
				} else {
					query.andWhere('channel.name ILIKE :q', { q: `%${ sqlLikeEscape(ps.query) }%` });
				}
			}

			const channels = await query
				.limit(ps.limit)
				.getMany();

			return await Promise.all(channels.map(x => this.channelEntityService.pack(x, me)));
		});
	}
}
