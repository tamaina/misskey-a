/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { referenceReversiGamesDefinition, referenceReversiGamesInput, referenceReversiGamesOutput } from '../../../contract/reference-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { ReversiGameEntityService } from '../../serializers/ReversiGameEntityService.js';
import { DI } from '@/di-symbols.js';
import type { ReversiGamesRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';

const contractProjection = projectEndpointContract(referenceReversiGamesDefinition);

export const meta = {
	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof referenceReversiGamesInput, typeof referenceReversiGamesOutput> {
	constructor(
		@Inject(DI.reversiGamesRepository)
		private reversiGamesRepository: ReversiGamesRepository,

		private reversiGameEntityService: ReversiGameEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.reversiGamesRepository.createQueryBuilder('game'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.innerJoinAndSelect('game.user1', 'user1')
				.innerJoinAndSelect('game.user2', 'user2');

			if (ps.my && me) {
				query.andWhere(new Brackets(qb => {
					qb
						.where('game.user1Id = :userId', { userId: me.id })
						.orWhere('game.user2Id = :userId', { userId: me.id });
				}));
			} else {
				query.andWhere('game.isStarted = TRUE');
			}

			const games = await query.take(ps.limit).getMany();

			return await this.reversiGameEntityService.packLiteMany(games);
		});
	}
}
