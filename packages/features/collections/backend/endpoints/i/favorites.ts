/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedNoteFavorite } from '../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal, decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../api.definition.js';
import type { CollectionsDependencies } from '../../api.implementation.js';
export interface IFavoritesDependencies<Actor extends ApiActor> {
	queryService: Pick<CollectionsDependencies<Actor>['queryService'], 'makePaginationQuery'>;
	noteFavoritesRepository: Pick<CollectionsDependencies<Actor>['noteFavoritesRepository'], 'createQueryBuilder'>;
	noteFavoriteEntityService: Pick<CollectionsDependencies<Actor>['noteFavoriteEntityService'], 'packMany'>;
}
export function createIFavoritesProcedure<Actor extends ApiActor>(deps: IFavoritesDependencies<Actor>) {
	return createApiProcedure<Actor>()(collectionsContract.iFavorites).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ limit: 'integer', sinceDate: 'integer', untilDate: 'integer' }))
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.noteFavoritesRepository.createQueryBuilder('favorite'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('favorite.userId = :meId', { meId: me.id })
				.leftJoinAndSelect('favorite.note', 'note');
			const favorites = await query
				.limit(ps.limit)
				.getMany();
			return (await deps.noteFavoriteEntityService.packMany(favorites, me)).map(toPackedNoteFavorite);
		});
}
