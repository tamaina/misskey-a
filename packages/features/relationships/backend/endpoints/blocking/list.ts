/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedBlockingListDefinition, packedBlockingListInput, packedBlockingListOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { BlockingsRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { BlockingEntityService } from '../../serializers/BlockingEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedBlockingListDefinition);

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'read:blocks',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedBlockingListInput, typeof packedBlockingListOutput> {
	constructor(
		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		private blockingEntityService: BlockingEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.blockingsRepository.createQueryBuilder('blocking'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('blocking.blockerId = :meId', { meId: me.id });

			const blockings = await query
				.limit(ps.limit)
				.getMany();

			return await this.blockingEntityService.packMany(blockings, me);
		});
	}
}
