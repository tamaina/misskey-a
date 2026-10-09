/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { collectionsContract } from '../../../api.contract.js';
import type { CollectionsDependencies } from '../../../api.dependencies.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { collectionsErrors } from '../../../api.errors.js';
export interface NotesFavoritesCreateDependencies<Actor extends ApiActor> {
	getterService: Pick<CollectionsDependencies<Actor>['getterService'], 'getNote'>;
	noteEntityService: Pick<CollectionsDependencies<Actor>['noteEntityService'], 'isVisibleForMe'>;
	noteFavoritesRepository: Pick<CollectionsDependencies<Actor>['noteFavoritesRepository'], 'exists' | 'insert'>;
	idService: Pick<CollectionsDependencies<Actor>['idService'], 'gen'>;
	achievementService: Pick<CollectionsDependencies<Actor>['achievementService'], 'create'>;
}
export function createNotesFavoritesCreateProcedure<Actor extends ApiActor>(deps: NotesFavoritesCreateDependencies<Actor>) {
	return implement(collectionsContract.notesFavoritesCreate, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: collectionsContract.notesFavoritesCreate['~orpc'].meta.requestName, requireCredential: true, prohibitMoved: true, kind: 'write:favorites', limit: { duration: 3600000, max: 20 } })).use(requirePrincipal<Actor>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			// Get favoritee
			const note = await deps.getterService.getNote(ps.noteId).catch(err => {
				if (err !== null && typeof err === 'object' && 'id' in err && err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(collectionsErrors.notesFavoritesCreate.noSuchNote);
				throw err;
			});
			// check visibility
			if (!await deps.noteEntityService.isVisibleForMe(note, me.id)) {
				throw apiError(collectionsErrors.notesFavoritesCreate.noSuchNote);
			}
			// if already favorited
			const exist = await deps.noteFavoritesRepository.exists({
				where: {
					noteId: note.id,
					userId: me.id,
				},
			});
			if (exist) {
				throw apiError(collectionsErrors.notesFavoritesCreate.alreadyFavorited);
			}
			// Create favorite
			await deps.noteFavoritesRepository.insert({
				id: deps.idService.gen(),
				noteId: note.id,
				userId: me.id,
			});
			if (note.userHost == null && note.userId !== me.id) {
				deps.achievementService.create(note.userId, 'myNoteFavorited1');
			}
		});
}
