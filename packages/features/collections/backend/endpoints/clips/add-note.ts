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
import { ClipService } from '../../services/ClipService.js';
export interface ClipsAddNoteDependencies<Actor extends ApiActor> {
	clipService: Pick<CollectionsDependencies<Actor>['clipService'], 'addNote'>;
}
export function createClipsAddNoteProcedure<Actor extends ApiActor>(deps: ClipsAddNoteDependencies<Actor>) {
	return implement(collectionsContract.clipsAddNote, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: collectionsContract.clipsAddNote['~orpc'].meta.requestName, requireCredential: true, prohibitMoved: true, kind: 'write:account', limit: { duration: 3600000, max: 20 } })).use(requirePrincipal<Actor>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			try { await deps.clipService.addNote(me, ps.clipId, ps.noteId); } catch (error) {
				if (error instanceof ClipService.NoSuchClipError) throw apiError(collectionsErrors.clipsAddNote.noSuchClip);
				if (error instanceof ClipService.NoSuchNoteError) throw apiError(collectionsErrors.clipsAddNote.noSuchNote);
				if (error instanceof ClipService.AlreadyAddedError) throw apiError(collectionsErrors.clipsAddNote.alreadyClipped);
				if (error instanceof ClipService.TooManyClipNotesError) throw apiError(collectionsErrors.clipsAddNote.tooManyClipNotes);
				throw error;
			}
		});
}
