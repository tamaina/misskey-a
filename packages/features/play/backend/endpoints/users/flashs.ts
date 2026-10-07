/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedUsersFlashsDefinition, packedUsersFlashsInput, packedUsersFlashsOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { FlashEntityService } from '../../serializers/FlashEntityService.js';
import type { FlashsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedUsersFlashsDefinition);

export const meta = {
	tags: ['users', 'flashs'],

	description: 'Show all flashs this user created.',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedUsersFlashsInput, typeof packedUsersFlashsOutput> {
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		private flashEntityService: FlashEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.flashsRepository.createQueryBuilder('flash'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('flash.userId = :userId', { userId: ps.userId })
				.andWhere('flash.visibility = \'public\'');

			const flashs = await query
				.limit(ps.limit)
				.getMany();

			return await this.flashEntityService.packMany(flashs);
		});
	}
}
