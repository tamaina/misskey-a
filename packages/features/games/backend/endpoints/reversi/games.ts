/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedReversiGameLite } from '../../reversi.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { reversiGamesContract } from './games.contract.js';
import { Brackets } from 'typeorm';
import type { ReversiGameEntityService } from '../../serializers/ReversiGameEntityService.js';
import type { ReversiGamesRepository } from '@features/persistence/backend/repositories/models.js';
import type { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface ReversiGamesDependencies {
	reversiGamesRepository: Pick<ReversiGamesRepository, 'createQueryBuilder'>;
	reversiGameEntityService: Pick<ReversiGameEntityService, 'packLiteMany'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
}
export function createReversiGamesProcedure(deps: ReversiGamesDependencies) {
	return createApiProcedure<MiLocalUser>()(reversiGamesContract)
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.reversiGamesRepository.createQueryBuilder('game'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
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
			return (await deps.reversiGameEntityService.packLiteMany(games)).map(toPackedReversiGameLite);
		});
}
