/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { inlineHashtagsSearchDefinition, inlineHashtagsSearchInput, inlineHashtagsSearchOutput } from '../../../contract/endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { HashtagsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { sqlLikeEscape } from '@features/persistence/backend/utility/sql-like-escape.js';

const contractProjection = projectEndpointContract(inlineHashtagsSearchDefinition);

export const meta = {
	tags: ['hashtags'],

	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineHashtagsSearchInput, typeof inlineHashtagsSearchOutput> {
	constructor(
		@Inject(DI.hashtagsRepository)
		private hashtagsRepository: HashtagsRepository,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const hashtags = await this.hashtagsRepository.createQueryBuilder('tag')
				.where('tag.name like :q', { q: sqlLikeEscape(ps.query.toLowerCase()) + '%' })
				.orderBy('tag.mentionedLocalUsersCount', 'DESC')
				.groupBy('tag.id')
				.limit(ps.limit)
				.offset(ps.offset)
				.getMany();

			return hashtags.map(tag => tag.name);
		});
	}
}
