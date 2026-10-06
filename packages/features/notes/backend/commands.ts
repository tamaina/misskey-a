/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { JsonSchema } from '@valibot/to-json-schema';
import type { ApiErrorDefinition } from '../../api/contract/index.js';
import { toLegacyJsonSchema, featureProcedure } from '../../api/backend/index.js';
import { notesCommandErrors, notesCommandInputs, notesCommandsContract } from '../contract/index.js';

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

	isModerator(actor: Actor): Promise<boolean>;
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
	createError(definition: ApiErrorDefinition): Error;
}

function requireActor<Actor extends NotesCommandActor>(context: NotesCommandContext<Actor> | null | undefined): Actor {
	if (context?.actor == null || typeof context.actor.id !== 'string' || context.actor.id.length === 0) {
		throw new Error('An authenticated note actor is required');
	}

	return context.actor;
}

function readErrorId(error: unknown): unknown {
	// Preserve the old direct `.id` check, including its behavior for malformed nullish rejections.
	return (error as { id?: unknown }).id;
}

function mapError<Actor extends NotesCommandActor, Note extends NotesCommandNote, Draft extends NotesCommandDraft, Author extends NotesCommandAuthor>(
	deps: NotesCommandsDependencies<Actor, Note, Draft, Author>,
	error: unknown,
	errorId: string,
	definition: ApiErrorDefinition,
): never {
	if (readErrorId(error) === errorId) throw deps.createError(definition);
	throw error;
}

const getterNoteNotFoundId = '9725d0ce-ba28-4dde-95a7-2cbb2c15de24';

/** Create the note write commands using only typed service ports and a trusted authenticated actor. */
export function createNotesCommands<
	Actor extends NotesCommandActor,
	Note extends NotesCommandNote,
	Draft extends NotesCommandDraft,
	Author extends NotesCommandAuthor,
>(deps: NotesCommandsDependencies<Actor, Note, Draft, Author>) {
	const bind = featureProcedure<NotesCommandContext<Actor>>();
	const getNote = async (noteId: string, errorDefinition: ApiErrorDefinition): Promise<Note> => {
		try {
			return await deps.getNote(noteId);
		} catch (error) {
			mapError(deps, error, getterNoteNotFoundId, errorDefinition);
		}
	};

	return {
		'notes/delete': bind(notesCommandsContract['notes/delete'], async ({ input, context }) => {
			const actor = requireActor(context);
			const note = await getNote(input.noteId, notesCommandErrors['notes/delete'].noSuchNote);

			if (!await deps.isModerator(actor) && note.userId !== actor.id) {
				throw deps.createError(notesCommandErrors['notes/delete'].accessDenied);
			}

			const author = await deps.findUserByIdOrFail(note.userId);
			await deps.deleteNote(author, note, false, actor);
		}),
		'notes/drafts/delete': bind(notesCommandsContract['notes/drafts/delete'], async ({ input, context }) => {
			const actor = requireActor(context);
			const draft = await deps.getDraft(actor, input.draftId);
			if (draft == null) throw deps.createError(notesCommandErrors['notes/drafts/delete'].noSuchNoteDraft);

			if (draft.userId !== actor.id) {
				throw deps.createError(notesCommandErrors['notes/drafts/delete'].accessDenied);
			}

			await deps.deleteDraft(actor, draft.id);
		}),
		'notes/reactions/create': bind(notesCommandsContract['notes/reactions/create'], async ({ input, context }) => {
			const actor = requireActor(context);
			const note = await getNote(input.noteId, notesCommandErrors['notes/reactions/create'].noSuchNote);
			try {
				await deps.createReaction(actor, note, input.reaction);
			} catch (error) {
				const errorId = readErrorId(error);
				if (errorId === '51c42bb4-931a-456b-bff7-e5a8a70dd298') {
					throw deps.createError(notesCommandErrors['notes/reactions/create'].alreadyReacted);
				}
				if (errorId === 'e70412a4-7197-4726-8e74-f3e0deb92aa7') {
					throw deps.createError(notesCommandErrors['notes/reactions/create'].youHaveBeenBlocked);
				}
				if (errorId === '12c35529-3c79-4327-b1cc-e2cf63a71925') {
					throw deps.createError(notesCommandErrors['notes/reactions/create'].cannotReactToRenote);
				}
				throw error;
			}
		}),
		'notes/reactions/delete': bind(notesCommandsContract['notes/reactions/delete'], async ({ input, context }) => {
			const actor = requireActor(context);
			const note = await getNote(input.noteId, notesCommandErrors['notes/reactions/delete'].noSuchNote);
			try {
				await deps.deleteReaction(actor, note);
			} catch (error) {
				if (readErrorId(error) === '60527ec9-b4cb-4a88-a6bd-32d3ad26817d') {
					throw deps.createError(notesCommandErrors['notes/reactions/delete'].notReacted);
				}
				throw error;
			}
		}),
		'notes/thread-muting/create': bind(notesCommandsContract['notes/thread-muting/create'], async ({ input, context }) => {
			const actor = requireActor(context);
			const note = await getNote(input.noteId, notesCommandErrors['notes/thread-muting/create'].noSuchNote);
			const threadId = note.threadId ?? note.id;

			if (await deps.threadMuteExists(threadId, actor.id)) {
				throw deps.createError(notesCommandErrors['notes/thread-muting/create'].alreadyMuting);
			}

			await deps.insertThreadMute(deps.newId(), threadId, actor.id);
		}),
		'notes/thread-muting/delete': bind(notesCommandsContract['notes/thread-muting/delete'], async ({ input, context }) => {
			const actor = requireActor(context);
			const note = await getNote(input.noteId, notesCommandErrors['notes/thread-muting/delete'].noSuchNote);
			await deps.deleteThreadMute(note.threadId ?? note.id, actor.id);
		}),
		'notes/unrenote': bind(notesCommandsContract['notes/unrenote'], async ({ input, context }) => {
			const actor = requireActor(context);
			const note = await getNote(input.noteId, notesCommandErrors['notes/unrenote'].noSuchNote);
			const renotes = await deps.findRenotesByUserAndRenote(actor.id, note.id);

			for (const renote of renotes) {
				const author = await deps.findUserByIdOrFail(actor.id);
				// This was deliberately fire-and-forget in the legacy handler.
				deps.deleteNote(author, renote);
			}
		}),
		'promo/read': bind(notesCommandsContract['promo/read'], async ({ input, context }) => {
			const actor = requireActor(context);
			const note = await getNote(input.noteId, notesCommandErrors['promo/read'].noSuchNote);

			if (await deps.promoReadExists(note.id, actor.id)) return;

			await deps.insertPromoRead(deps.newId(), note.id, actor.id);
		}),
	};
}

export type NotesCommandsFeature<
	Actor extends NotesCommandActor,
	Note extends NotesCommandNote,
	Draft extends NotesCommandDraft,
	Author extends NotesCommandAuthor,
> = ReturnType<typeof createNotesCommands<Actor, Note, Draft, Author>>;

export const legacyNotesCommandSchemas: Record<keyof typeof notesCommandInputs, { input: JsonSchema }> = {
	'notes/delete': { input: toLegacyJsonSchema(notesCommandInputs['notes/delete'], { target: 'openapi-3.0' }) },
	'notes/drafts/delete': { input: toLegacyJsonSchema(notesCommandInputs['notes/drafts/delete'], { target: 'openapi-3.0' }) },
	'notes/reactions/create': { input: toLegacyJsonSchema(notesCommandInputs['notes/reactions/create'], { target: 'openapi-3.0' }) },
	'notes/reactions/delete': { input: toLegacyJsonSchema(notesCommandInputs['notes/reactions/delete'], { target: 'openapi-3.0' }) },
	'notes/thread-muting/create': { input: toLegacyJsonSchema(notesCommandInputs['notes/thread-muting/create'], { target: 'openapi-3.0' }) },
	'notes/thread-muting/delete': { input: toLegacyJsonSchema(notesCommandInputs['notes/thread-muting/delete'], { target: 'openapi-3.0' }) },
	'notes/unrenote': { input: toLegacyJsonSchema(notesCommandInputs['notes/unrenote'], { target: 'openapi-3.0' }) },
	'promo/read': { input: toLegacyJsonSchema(notesCommandInputs['promo/read'], { target: 'openapi-3.0' }) },
};
