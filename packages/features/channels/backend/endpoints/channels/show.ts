/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedChannelsShowDefinition, packedChannelsShowInput, packedChannelsShowOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { ChannelsRepository } from '@/models/_.js';
import { ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedChannelsShowDefinition);

export const meta = {
	tags: ['channels'],

	requireCredential: false,

	res: contractProjection.response,

	errors: {
		noSuchChannel: {
			message: 'No such channel.',
			code: 'NO_SUCH_CHANNEL',
			id: '6f6c314b-7486-4897-8966-c04a66a02923',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedChannelsShowInput, typeof packedChannelsShowOutput> {
	constructor(
		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		private channelEntityService: ChannelEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const channel = await this.channelsRepository.findOneBy({
				id: ps.channelId,
			});

			if (channel == null) {
				throw new ApiError(meta.errors.noSuchChannel);
			}

			return await this.channelEntityService.pack(channel, me, true);
		});
	}
}
