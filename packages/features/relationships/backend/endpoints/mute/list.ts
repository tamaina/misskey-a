/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedMuteListDefinition, packedMuteListInput, packedMuteListOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { MutingsRepository } from '@/models/_.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { MutingEntityService } from '../../serializers/MutingEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedMuteListDefinition);

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'read:mutes',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedMuteListInput, typeof packedMuteListOutput> {
	constructor(
		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		private mutingEntityService: MutingEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.mutingsRepository.createQueryBuilder('muting'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('muting.muterId = :meId', { meId: me.id });

			const mutings = await query
				.limit(ps.limit)
				.getMany();

			return await this.mutingEntityService.packMany(mutings, me);
		});
	}
}
