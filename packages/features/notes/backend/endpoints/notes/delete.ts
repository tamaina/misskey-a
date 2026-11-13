/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { apiError } from "@features/api/backend/transport/orpc-error.js";
import type { DeleteNoteDependencies } from '../../delete-note.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { notesDeleteContract } from './delete.contract.js';
import type { ApiActor } from "@features/api/backend/transport/context.js";
export function createDeleteProcedure<Actor extends ApiActor, Note extends { userId: string }, Author>(deps: DeleteNoteDependencies<Actor, Note, Author>) {
	return createApiProcedure<Actor>()(notesDeleteContract).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
		const noteId = input.noteId;
		const actor = context.principal;
		let note: Note;
		try {
			note = await deps.getNote(noteId);
		} catch (error) {
			if (error !== null && typeof error === 'object' && 'id' in error
				&& error.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') {
				throw apiError({
					code: 'NO_SUCH_NOTE', message: 'No such note.',
					id: '490be23f-8c1f-4796-819f-94cb4f9d1630'
				});
			}
			throw error;
		}
		if (!await deps.isModerator(actor) && note.userId !== actor.id) {
			throw apiError({
				code: 'ACCESS_DENIED', message: 'Access denied.',
				id: 'fe8d7103-0ea8-4ec3-814d-f8b401dc69e9'
			});
		}
		const author = await deps.findAuthor(note.userId);
		await deps.delete(author, note, false, actor);
	});
}
