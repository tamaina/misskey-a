/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { inlineHashtagsTrendDefinition, inlineHashtagsTrendInput, inlineHashtagsTrendOutput } from '../../../contract/endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { DI } from '@/di-symbols.js';
import { FeaturedService } from '../../services/FeaturedService.js';
import { HashtagService } from '../../services/HashtagService.js';

const contractProjection = projectEndpointContract(inlineHashtagsTrendDefinition);

export const meta = {
	tags: ['hashtags'],

	requireCredential: false,
	allowGet: true,
	cacheSec: 60 * 1,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineHashtagsTrendInput, typeof inlineHashtagsTrendOutput> {
	constructor(
		private featuredService: FeaturedService,
		private hashtagService: HashtagService,
	) {
		super(meta, contractProjection, async () => {
			const ranking = await this.featuredService.getHashtagsRanking(10);

			const charts = ranking.length === 0 ? {} : await this.hashtagService.getCharts(ranking, 20);

			const stats = ranking.map((tag, i) => ({
				tag,
				chart: charts[tag],
				usersCount: Math.max(...charts[tag]),
			}));

			return stats;
		});
	}
}
