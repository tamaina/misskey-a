/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import { collectionsContract } from '../../api.contract.js';
import type { CollectionsDependencies } from '../../api.dependencies.js';
export interface ClipsMyFavoritesDependencies<Actor extends ApiActor> {
	clipFavoritesRepository: Pick<CollectionsDependencies<Actor>['clipFavoritesRepository'], 'createQueryBuilder'>;
	clipEntityService: Pick<CollectionsDependencies<Actor>['clipEntityService'], 'packMany'>;
}
export function createClipsMyFavoritesProcedure<Actor extends ApiActor>(deps: ClipsMyFavoritesDependencies<Actor>) {
	return implement(collectionsContract.clipsMyFavorites, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: collectionsContract.clipsMyFavorites['~orpc'].meta.requestName, requireCredential: true, kind: 'read:clip-favorite' })).use(requirePrincipal<Actor>())
		.handler(async ({ context }) => {
			const me = context.principal;
			const query = deps.clipFavoritesRepository.createQueryBuilder('favorite')
				.andWhere('favorite.userId = :meId', { meId: me.id })
				.leftJoinAndSelect('favorite.clip', 'clip');
			const favorites = await query
				.getMany();
			return deps.clipEntityService.packMany(favorites.map(x => x.clip!), me);
		});
}
