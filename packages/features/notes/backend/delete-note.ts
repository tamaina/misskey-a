/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export interface DeleteNoteDependencies<Actor, Note extends { userId: string }, Author> {
	getNote(id: string): Promise<Note>;
	isModerator(actor: Actor): Promise<boolean>;
	findAuthor(id: string): Promise<Author>;
	delete(author: Author, note: Note, quiet: false, actor: Actor): Promise<unknown>;
}
