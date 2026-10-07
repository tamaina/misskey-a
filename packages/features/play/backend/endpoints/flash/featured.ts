/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedFlashFeaturedDefinition, packedFlashFeaturedInput, packedFlashFeaturedOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { FlashsRepository } from '@/models/_.js';

import { FlashEntityService } from '../../serializers/FlashEntityService.js';
import { DI } from '@/di-symbols.js';
import { FlashService } from '../../services/FlashService.js';

const contractProjection = projectEndpointContract(packedFlashFeaturedDefinition);

export const meta = {
	tags: ['flash'],

	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedFlashFeaturedInput, typeof packedFlashFeaturedOutput> {
	constructor(
		private flashService: FlashService,
		private flashEntityService: FlashEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const result = await this.flashService.featured({
				offset: ps.offset,
				limit: ps.limit,
			});
			return await this.flashEntityService.packMany(result, me);
		});
	}
}
