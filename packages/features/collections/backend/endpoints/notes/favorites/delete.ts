/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../../api.definition.js';
import type { CollectionsDependencies } from '../../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { collectionsErrors } from '../../../api.errors.js';
export interface NotesFavoritesDeleteDependencies<Actor extends ApiActor> {
	getterService: Pick<CollectionsDependencies<Actor>['getterService'], 'getNote'>;
	noteFavoritesRepository: Pick<CollectionsDependencies<Actor>['noteFavoritesRepository'], 'delete' | 'findOneBy'>;
}
export function createNotesFavoritesDeleteProcedure<Actor extends ApiActor>(deps: NotesFavoritesDeleteDependencies<Actor>) {
	return implement(collectionsContract.notesFavoritesDelete, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: collectionsContract.notesFavoritesDelete['~orpc'].meta.requestName, requireCredential: true, kind: 'write:favorites' })).use(requirePrincipal<Actor>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			// Get favoritee
			const note = await deps.getterService.getNote(ps.noteId).catch(err => {
				if (err !== null && typeof err === 'object' && 'id' in err && err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(collectionsErrors.notesFavoritesDelete.noSuchNote);
				throw err;
			});
			// if already favorited
			const exist = await deps.noteFavoritesRepository.findOneBy({
				noteId: note.id,
				userId: me.id,
			});
			if (exist == null) {
				throw apiError(collectionsErrors.notesFavoritesDelete.notFavorited);
			}
			// Delete favorite
			await deps.noteFavoritesRepository.delete(exist.id);
		});
}
