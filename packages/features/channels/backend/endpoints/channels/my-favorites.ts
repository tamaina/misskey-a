/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedChannelsMyFavoritesDefinition, packedChannelsMyFavoritesInput, packedChannelsMyFavoritesOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { ChannelFavoritesRepository } from '@features/persistence/backend/repositories/models.js';
import { ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedChannelsMyFavoritesDefinition);

export const meta = {
	tags: ['channels', 'account'],

	requireCredential: true,

	kind: 'read:channels',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedChannelsMyFavoritesInput, typeof packedChannelsMyFavoritesOutput> {
	constructor(
		@Inject(DI.channelFavoritesRepository)
		private channelFavoritesRepository: ChannelFavoritesRepository,

		private channelEntityService: ChannelEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.channelFavoritesRepository.createQueryBuilder('favorite')
				.andWhere('favorite.userId = :meId', { meId: me.id })
				.leftJoinAndSelect('favorite.channel', 'channel');

			const favorites = await query
				.getMany();

			return await Promise.all(favorites.map(x => this.channelEntityService.pack(x.channel!, me)));
		});
	}
}
