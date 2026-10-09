/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../api.definition.js';
import type { CollectionsDependencies } from '../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { collectionsErrors } from '../../api.errors.js';
export interface ClipsUnfavoriteDependencies<Actor extends ApiActor> {
	clipsRepository: Pick<CollectionsDependencies<Actor>['clipsRepository'], 'findOneBy'>;
	clipFavoritesRepository: Pick<CollectionsDependencies<Actor>['clipFavoritesRepository'], 'delete' | 'findOneBy'>;
}
export function createClipsUnfavoriteProcedure<Actor extends ApiActor>(deps: ClipsUnfavoriteDependencies<Actor>) {
	return createApiProcedure<Actor>()(collectionsContract.clipsUnfavorite).use(requirePrincipal<Actor>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const clip = await deps.clipsRepository.findOneBy({ id: ps.clipId });
			if (clip === null) throw apiError(collectionsErrors.clipsUnfavorite.noSuchClip);
			// Removal stays possible after another user's previously public clip becomes private.
			const favorite = await deps.clipFavoritesRepository.findOneBy({ clipId: clip.id, userId: me.id });
			if (favorite === null) throw apiError(collectionsErrors.clipsUnfavorite.notFavorited);
			await deps.clipFavoritesRepository.delete(favorite.id);
		});
}
