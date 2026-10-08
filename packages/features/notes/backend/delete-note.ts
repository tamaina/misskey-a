/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { apiError } from '../../api/backend/transport/orpc-error.js';

export interface DeleteNoteDependencies<Actor, Note extends { userId: string }, Author> {
	getNote(id: string): Promise<Note>;
	isModerator(actor: Actor): Promise<boolean>;
	findAuthor(id: string): Promise<Author>;
	delete(author: Author, note: Note, quiet: false, actor: Actor): Promise<unknown>;
}

/** Ordinary application operation; the router supplies an authenticated actor. */
export function createDeleteNote<Actor extends { id: string }, Note extends { userId: string }, Author>(
	deps: DeleteNoteDependencies<Actor, Note, Author>,
) {
	return async (noteId: string, actor: Actor): Promise<void> => {
		let note: Note;
		try {
			note = await deps.getNote(noteId);
		} catch (error) {
			if (error !== null && typeof error === 'object' && 'id' in error
				&& error.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') {
				throw apiError({ code: 'NO_SUCH_NOTE', message: 'No such note.',
					id: '490be23f-8c1f-4796-819f-94cb4f9d1630' });
			}
			throw error;
		}
		if (!await deps.isModerator(actor) && note.userId !== actor.id) {
			throw apiError({ code: 'ACCESS_DENIED', message: 'Access denied.',
				id: 'fe8d7103-0ea8-4ec3-814d-f8b401dc69e9' });
		}
		const author = await deps.findAuthor(note.userId);
		await deps.delete(author, note, false, actor);
	};
}
