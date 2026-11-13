/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedClip } from '../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../api.definition.js';
import type { CollectionsDependencies } from '../../api.implementation.js';
export interface ClipsMyFavoritesDependencies<Actor extends ApiActor> {
	clipFavoritesRepository: Pick<CollectionsDependencies<Actor>['clipFavoritesRepository'], 'createQueryBuilder'>;
	clipEntityService: Pick<CollectionsDependencies<Actor>['clipEntityService'], 'packMany'>;
}
export function createClipsMyFavoritesProcedure<Actor extends ApiActor>(deps: ClipsMyFavoritesDependencies<Actor>) {
	return createApiProcedure<Actor>()(collectionsContract.clipsMyFavorites).use(requirePrincipal<Actor>())
		.handler(async ({ context }) => {
			const me = context.principal;
			const query = deps.clipFavoritesRepository.createQueryBuilder('favorite')
				.andWhere('favorite.userId = :meId', { meId: me.id })
				.leftJoinAndSelect('favorite.clip', 'clip');
			const favorites = await query
				.getMany();
			return (await deps.clipEntityService.packMany(favorites.map(x => x.clip!), me)).map(toPackedClip);
		});
}
