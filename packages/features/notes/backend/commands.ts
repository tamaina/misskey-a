/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readErrorId } from './request.schema.js';
import { notesDraftsDeleteInput, notesDraftsDeleteErrors } from './endpoints/notes/drafts/delete.contract.js';
import { notesReactionsCreateInput, notesReactionsCreateErrors } from './endpoints/notes/reactions/create.contract.js';
import { notesReactionsDeleteInput, notesReactionsDeleteErrors } from './endpoints/notes/reactions/delete.contract.js';
import { notesThreadMutingCreateInput, notesThreadMutingCreateErrors } from './endpoints/notes/thread-muting/create.contract.js';
import { notesThreadMutingDeleteInput, notesThreadMutingDeleteErrors } from './endpoints/notes/thread-muting/delete.contract.js';
import { notesUnrenoteInput, notesUnrenoteErrors } from './endpoints/notes/unrenote.contract.js';
import { promoReadInput, promoReadErrors } from './endpoints/promo/read.contract.js';
import type { ErrorDefinition } from '../../api/backend/transport/orpc-error.js';
import type * as v from 'valibot';

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

/** Narrow ports used by the note commands; adapters bind these to existing backend services and repositories. */
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

const getterNoteNotFoundId = '9725d0ce-ba28-4dde-95a7-2cbb2c15de24';

/** Direct application operations; no API transport or legacy endpoint is invoked. */
export function createNotesCommandOperations<
	Actor extends NotesCommandActor,
	Note extends NotesCommandNote,
	Draft extends NotesCommandDraft,
	Author extends NotesCommandAuthor,
>(deps: NotesCommandsDependencies<Actor, Note, Draft, Author>) {
	const getNote = async (noteId: string, errorDefinition: ErrorDefinition): Promise<Note> => {
		try { return await deps.getNote(noteId); } catch (error) {
			if (readErrorId(error) === getterNoteNotFoundId) throw deps.createError(errorDefinition);
			throw error;
		}
	};
	return {
		async notesDraftsDelete(input: v.InferOutput<typeof notesDraftsDeleteInput>, actor: Actor): Promise<void> {
			const draft = await deps.getDraft(actor, input.draftId);
			if (draft == null) throw deps.createError(notesDraftsDeleteErrors.noSuchNoteDraft);

			if (draft.userId !== actor.id) {
				throw deps.createError(notesDraftsDeleteErrors.accessDenied);
			}

			await deps.deleteDraft(actor, draft.id);
		},
		async notesReactionsCreate(input: v.InferOutput<typeof notesReactionsCreateInput>, actor: Actor): Promise<void> {
			const note = await getNote(input.noteId, notesReactionsCreateErrors.noSuchNote);
			try {
				await deps.createReaction(actor, note, input.reaction);
			} catch (error) {
				const errorId = readErrorId(error);
				if (errorId === '51c42bb4-931a-456b-bff7-e5a8a70dd298') {
					throw deps.createError(notesReactionsCreateErrors.alreadyReacted);
				}
				if (errorId === 'e70412a4-7197-4726-8e74-f3e0deb92aa7') {
					throw deps.createError(notesReactionsCreateErrors.youHaveBeenBlocked);
				}
				if (errorId === '12c35529-3c79-4327-b1cc-e2cf63a71925') {
					throw deps.createError(notesReactionsCreateErrors.cannotReactToRenote);
				}
				throw error;
			}
		},
		async notesReactionsDelete(input: v.InferOutput<typeof notesReactionsDeleteInput>, actor: Actor): Promise<void> {
			const note = await getNote(input.noteId, notesReactionsDeleteErrors.noSuchNote);
			try {
				await deps.deleteReaction(actor, note);
			} catch (error) {
				if (readErrorId(error) === '60527ec9-b4cb-4a88-a6bd-32d3ad26817d') {
					throw deps.createError(notesReactionsDeleteErrors.notReacted);
				}
				throw error;
			}
		},
		async notesThreadMutingCreate(input: v.InferOutput<typeof notesThreadMutingCreateInput>, actor: Actor): Promise<void> {
			const note = await getNote(input.noteId, notesThreadMutingCreateErrors.noSuchNote);
			const threadId = note.threadId ?? note.id;

			if (await deps.threadMuteExists(threadId, actor.id)) {
				throw deps.createError(notesThreadMutingCreateErrors.alreadyMuting);
			}

			await deps.insertThreadMute(deps.newId(), threadId, actor.id);
		},
		async notesThreadMutingDelete(input: v.InferOutput<typeof notesThreadMutingDeleteInput>, actor: Actor): Promise<void> {
			const note = await getNote(input.noteId, notesThreadMutingDeleteErrors.noSuchNote);
			await deps.deleteThreadMute(note.threadId ?? note.id, actor.id);
		},
		async notesUnrenote(input: v.InferOutput<typeof notesUnrenoteInput>, actor: Actor): Promise<void> {
			const note = await getNote(input.noteId, notesUnrenoteErrors.noSuchNote);
			const renotes = await deps.findRenotesByUserAndRenote(actor.id, note.id);

			for (const renote of renotes) {
				const author = await deps.findUserByIdOrFail(actor.id);
				// This was deliberately fire-and-forget in the legacy handler.
				deps.deleteNote(author, renote);
			}
		},
		async promoRead(input: v.InferOutput<typeof promoReadInput>, actor: Actor): Promise<void> {
			const note = await getNote(input.noteId, promoReadErrors.noSuchNote);

			if (await deps.promoReadExists(note.id, actor.id)) return;

			await deps.insertPromoRead(deps.newId(), note.id, actor.id);
		},
	};
}

export type NotesCommandOperations<Actor extends NotesCommandActor, Note extends NotesCommandNote, Draft extends NotesCommandDraft, Author extends NotesCommandAuthor> = ReturnType<typeof createNotesCommandOperations<Actor, Note, Draft, Author>>;
export const createNotesCommands = createNotesCommandOperations;
export type NotesCommandsFeature<Actor extends NotesCommandActor, Note extends NotesCommandNote, Draft extends NotesCommandDraft, Author extends NotesCommandAuthor> = NotesCommandOperations<Actor, Note, Draft, Author>;
