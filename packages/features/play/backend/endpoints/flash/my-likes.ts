/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedFlashMyLikesDefinition, packedFlashMyLikesInput, packedFlashMyLikesOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { FlashLikeEntityService } from '../../serializers/FlashLikeEntityService.js';
import { DI } from '@/di-symbols.js';
import { FlashService } from '../../services/FlashService.js';

const contractProjection = projectEndpointContract(packedFlashMyLikesDefinition);

export const meta = {
	tags: ['account', 'flash'],

	requireCredential: true,

	kind: 'read:flash-likes',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedFlashMyLikesInput, typeof packedFlashMyLikesOutput> {
	constructor(
		private flashLikeEntityService: FlashLikeEntityService,
		private flashService: FlashService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const likes = await this.flashService.myLikes(me.id, {
				sinceId: ps.sinceId,
				untilId: ps.untilId,
				sinceDate: ps.sinceDate,
				untilDate: ps.untilDate,
				limit: ps.limit,
				search: ps.search,
			});

			return this.flashLikeEntityService.packMany(likes, me);
		});
	}
}
