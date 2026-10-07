/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedChannelsMuteListDefinition, packedChannelsMuteListInput, packedChannelsMuteListOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { ChannelMutingService } from '../../../services/ChannelMutingService.js';
import { ChannelEntityService } from '../../../serializers/ChannelEntityService.js';

const contractProjection = projectEndpointContract(packedChannelsMuteListDefinition);

export const meta = {
	tags: ['channels', 'mute'],

	requireCredential: true,
	prohibitMoved: true,

	kind: 'read:channels',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedChannelsMuteListInput, typeof packedChannelsMuteListOutput> {
	constructor(
		private channelMutingService: ChannelMutingService,
		private channelEntityService: ChannelEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const mutings = await this.channelMutingService.list({
				requestUserId: me.id,
			});
			return await this.channelEntityService.packMany(mutings, me);
		});
	}
}
