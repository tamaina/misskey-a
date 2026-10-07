/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedChannelsFeaturedDefinition, packedChannelsFeaturedInput, packedChannelsFeaturedOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { ChannelsRepository } from '@/models/_.js';
import { ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedChannelsFeaturedDefinition);

export const meta = {
	tags: ['channels'],

	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedChannelsFeaturedInput, typeof packedChannelsFeaturedOutput> {
	constructor(
		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		private channelEntityService: ChannelEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.channelsRepository.createQueryBuilder('channel')
				.where('channel.lastNotedAt IS NOT NULL')
				.andWhere('channel.isArchived = FALSE')
				.orderBy('channel.lastNotedAt', 'DESC');

			const channels = await query.limit(10).getMany();

			return await Promise.all(channels.map(x => this.channelEntityService.pack(x, me)));
		});
	}
}
