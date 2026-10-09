/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { ErrorDefinition } from '../../api/backend/transport/orpc-error.js';
import type { MiLocalUser, MiUser } from '../../users/backend/models/User.js';
import type { MiNote } from './models/Note.js';
import type { MiNoteDraft } from './models/NoteDraft.js';
export interface NotesCommandActor {
	id: string;
}
export interface NotesCommandContext<Actor extends NotesCommandActor> {
	actor: Actor;
}
export interface NotesCommandNote {
	id: string;
	userId: string;
	threadId?: string | null;
}
export interface NotesCommandDraft {
	id: string;
	userId: string;
}
export interface NotesCommandAuthor {
	id: string;
	uri: string | null;
	host: string | null;
	isBot: boolean;
}
export interface NotesCommandsDependencies<
	Actor extends NotesCommandActor,
	Note extends NotesCommandNote,
	Draft extends NotesCommandDraft,
	Author extends NotesCommandAuthor,
> {
	getNote(noteId: string): Promise<Note>;
	findUserByIdOrFail(userId: string): Promise<Author>;
	deleteNote(author: Author, note: Note, quiet?: boolean, deleter?: Actor): Promise<unknown>;
	getDraft(actor: Actor, draftId: string): Promise<Draft | null>;
	deleteDraft(actor: Actor, draftId: string): Promise<unknown>;
	createReaction(actor: Actor, note: Note, reaction: string): Promise<unknown>;
	deleteReaction(actor: Actor, note: Note): Promise<unknown>;
	threadMuteExists(threadId: string, userId: string): Promise<boolean>;
	insertThreadMute(id: string, threadId: string, userId: string): Promise<unknown>;
	deleteThreadMute(threadId: string, userId: string): Promise<unknown>;
	findRenotesByUserAndRenote(userId: string, renoteId: string): Promise<Note[]>;
	promoReadExists(noteId: string, userId: string): Promise<boolean>;
	insertPromoRead(id: string, noteId: string, userId: string): Promise<unknown>;
	newId(): string;
	createError(definition: ErrorDefinition): Error;
}
export type NotesCommandDependencies = NotesCommandsDependencies<MiLocalUser, MiNote, MiNoteDraft, MiUser>;
