/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import { collectionsContract } from '../../api.contract.js';
import type { CollectionsDependencies } from '../../api.dependencies.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { collectionsErrors } from '../../api.errors.js';
export interface ClipsFavoriteDependencies<Actor extends ApiActor> {
	clipsRepository: Pick<CollectionsDependencies<Actor>['clipsRepository'], 'findOneBy'>;
	clipFavoritesRepository: Pick<CollectionsDependencies<Actor>['clipFavoritesRepository'], 'exists' | 'insert'>;
	idService: Pick<CollectionsDependencies<Actor>['idService'], 'gen'>;
}
export function createClipsFavoriteProcedure<Actor extends ApiActor>(deps: ClipsFavoriteDependencies<Actor>) {
	return implement(collectionsContract.clipsFavorite, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: collectionsContract.clipsFavorite['~orpc'].meta.requestName, requireCredential: true, prohibitMoved: true, kind: 'write:clip-favorite' })).use(requirePrincipal<Actor>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const clip = await deps.clipsRepository.findOneBy({ id: ps.clipId });
			if (clip === null || (clip.userId !== me.id && !clip.isPublic)) throw apiError(collectionsErrors.clipsFavorite.noSuchClip);
			if (await deps.clipFavoritesRepository.exists({ where: { clipId: clip.id, userId: me.id } })) throw apiError(collectionsErrors.clipsFavorite.alreadyFavorited);
			await deps.clipFavoritesRepository.insert({ id: deps.idService.gen(), clipId: clip.id, userId: me.id });
		});
}
