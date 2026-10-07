/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedFlashSearchDefinition, packedFlashSearchInput, packedFlashSearchOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { FlashEntityService } from '../../serializers/FlashEntityService.js';
import { DI } from '@/di-symbols.js';
import { FlashService } from '../../services/FlashService.js';

const contractProjection = projectEndpointContract(packedFlashSearchDefinition);

export const meta = {
	tags: ['flash'],

	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedFlashSearchInput, typeof packedFlashSearchOutput> {
	constructor(
		private flashService: FlashService,
		private flashEntityService: FlashEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const result = await this.flashService.search(ps.query, {
				sinceId: ps.sinceId,
				untilId: ps.untilId,
				sinceDate: ps.sinceDate,
				untilDate: ps.untilDate,
				limit: ps.limit,
			});

			return await this.flashEntityService.packMany(result, me);
		});
	}
}
