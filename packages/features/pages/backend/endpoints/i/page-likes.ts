/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedIPageLikesDefinition, packedIPageLikesInput, packedIPageLikesOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { PageLikesRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { PageLikeEntityService } from '../../serializers/PageLikeEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedIPageLikesDefinition);

export const meta = {
	tags: ['account', 'pages'],

	requireCredential: true,

	kind: 'read:page-likes',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedIPageLikesInput, typeof packedIPageLikesOutput> {
	constructor(
		@Inject(DI.pageLikesRepository)
		private pageLikesRepository: PageLikesRepository,

		private pageLikeEntityService: PageLikeEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.pageLikesRepository.createQueryBuilder('like'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('like.userId = :meId', { meId: me.id })
				.leftJoinAndSelect('like.page', 'page');

			const likes = await query
				.limit(ps.limit)
				.getMany();

			return this.pageLikeEntityService.packMany(likes, me);
		});
	}
}
