/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedFlashMyDefinition, packedFlashMyInput, packedFlashMyOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { FlashsRepository } from '@/models/_.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { FlashEntityService } from '../../serializers/FlashEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedFlashMyDefinition);

export const meta = {
	tags: ['account', 'flash'],

	requireCredential: true,

	kind: 'read:flash',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedFlashMyInput, typeof packedFlashMyOutput> {
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		private flashEntityService: FlashEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.flashsRepository.createQueryBuilder('flash'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('flash.userId = :meId', { meId: me.id });

			const flashs = await query
				.limit(ps.limit)
				.getMany();

			return await this.flashEntityService.packMany(flashs);
		});
	}
}
