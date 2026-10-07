/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedUsersPagesDefinition, packedUsersPagesInput, packedUsersPagesOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { PageEntityService } from '../../serializers/PageEntityService.js';
import type { PagesRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedUsersPagesDefinition);

export const meta = {
	tags: ['users', 'pages'],

	description: 'Show all pages this user created.',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedUsersPagesInput, typeof packedUsersPagesOutput> {
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		private pageEntityService: PageEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.pagesRepository.createQueryBuilder('page'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('page.userId = :userId', { userId: ps.userId })
				.andWhere('page.visibility = \'public\'');

			const pages = await query
				.limit(ps.limit)
				.getMany();

			return await this.pageEntityService.packMany(pages);
		});
	}
}
