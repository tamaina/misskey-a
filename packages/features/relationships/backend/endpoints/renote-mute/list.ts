/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedRenoteMuteListDefinition, packedRenoteMuteListInput, packedRenoteMuteListOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { RenoteMutingsRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { RenoteMutingEntityService } from '../../serializers/RenoteMutingEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedRenoteMuteListDefinition);

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'read:mutes',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedRenoteMuteListInput, typeof packedRenoteMuteListOutput> {
	constructor(
		@Inject(DI.renoteMutingsRepository)
		private renoteMutingsRepository: RenoteMutingsRepository,

		private renoteMutingEntityService: RenoteMutingEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.renoteMutingsRepository.createQueryBuilder('muting'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('muting.muterId = :meId', { meId: me.id });

			const mutings = await query
				.limit(ps.limit)
				.getMany();

			return await this.renoteMutingEntityService.packMany(mutings, me);
		});
	}
}
