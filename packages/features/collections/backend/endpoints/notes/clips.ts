/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedClip } from '../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../api.definition.js';
import type { CollectionsDependencies } from '../../api.implementation.js';
import { In } from 'typeorm';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { collectionsErrors } from '../../api.errors.js';
export interface NotesClipsDependencies<Actor extends ApiActor> {
	getterService: Pick<CollectionsDependencies<Actor>['getterService'], 'getNote'>;
	clipNotesRepository: Pick<CollectionsDependencies<Actor>['clipNotesRepository'], 'findBy'>;
	clipsRepository: Pick<CollectionsDependencies<Actor>['clipsRepository'], 'findBy'>;
	clipEntityService: Pick<CollectionsDependencies<Actor>['clipEntityService'], 'packMany'>;
}
export function createNotesClipsProcedure<Actor extends ApiActor>(deps: NotesClipsDependencies<Actor>) {
	return createApiProcedure<Actor>()(collectionsContract.notesClips)
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const note = await deps.getterService.getNote(ps.noteId).catch(err => {
				if (err !== null && typeof err === 'object' && 'id' in err && err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(collectionsErrors.notesClips.noSuchNote);
				throw err;
			});
			const clipNotes = await deps.clipNotesRepository.findBy({
				noteId: note.id,
			});
			const clips = await deps.clipsRepository.findBy({
				id: In(clipNotes.map(x => x.clipId)),
				isPublic: true,
			});
			return (await deps.clipEntityService.packMany(clips, me)).map(toPackedClip);
		});
}
