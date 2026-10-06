/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** Creation-time shape, before persistence replaces related objects with IDs. */
export interface NoteDraft {
	renote?: object | null;
	text?: string | null;
	cw?: string | null;
	reply?: object | null;
	poll?: object | null;
	files?: readonly unknown[] | null;
}

export function isCreationRenote<T extends NoteDraft>(note: T): note is T & { renote: NonNullable<T['renote']> } {
	return note.renote != null;
}

export function isCreationQuote<T extends NoteDraft & { renote: object }>(note: T): note is T & (
	{ text: NonNullable<T['text']> } | { cw: NonNullable<T['cw']> } |
	{ reply: NonNullable<T['reply']> } | { poll: NonNullable<T['poll']> } |
	{ files: NonNullable<T['files']> }
) {
	// Keep parity with the stored-note predicate in backend/misc/is-renote.ts.
	// Empty text/CW count as content; an empty file list does not.
	return note.text != null || note.reply != null || note.cw != null ||
		note.poll != null || (note.files != null && note.files.length > 0);
}
