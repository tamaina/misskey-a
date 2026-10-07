/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedPagesFeaturedDefinition, packedPagesFeaturedInput, packedPagesFeaturedOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { PagesRepository } from '@/models/_.js';

import { PageEntityService } from '../../serializers/PageEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedPagesFeaturedDefinition);

export const meta = {
	tags: ['pages'],

	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedPagesFeaturedInput, typeof packedPagesFeaturedOutput> {
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		private pageEntityService: PageEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.pagesRepository.createQueryBuilder('page')
				.where('page.visibility = \'public\'')
				.andWhere('page.likedCount > 0')
				.orderBy('page.likedCount', 'DESC');

			const pages = await query.limit(10).getMany();

			return await this.pageEntityService.packMany(pages, me);
		});
	}
}
