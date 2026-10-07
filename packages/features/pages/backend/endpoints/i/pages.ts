/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedIPagesDefinition, packedIPagesInput, packedIPagesOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { PagesRepository } from '@/models/_.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { PageEntityService } from '../../serializers/PageEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedIPagesDefinition);

export const meta = {
	tags: ['account', 'pages'],

	requireCredential: true,

	kind: 'read:pages',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedIPagesInput, typeof packedIPagesOutput> {
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		private pageEntityService: PageEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.pagesRepository.createQueryBuilder('page'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('page.userId = :meId', { meId: me.id });

			const pages = await query
				.limit(ps.limit)
				.getMany();

			return await this.pageEntityService.packMany(pages);
		});
	}
}
