/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { createProcedureClient } from '@orpc/server';
import { notesStateContract, notesStateInput as inlineNotesStateInput, notesStateOutput as inlineNotesStateOutput } from '../../backend/endpoints/notes/state.contract.js';
import { NotesStateOperation, createNotesStateProcedure } from '../../backend/endpoints/notes/state.js';
import type { NotesApiContext } from '../../backend/operations.js';
import type { NotesRepository, NoteThreadMutingsRepository, NoteFavoritesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiNote } from '@features/notes/backend/models/Note.js';

const input = { noteId: 'abc123' };
const output = { isFavorited: true, isMutedThread: false };

test('native input and output infer their complete explicit properties', () => {
	expectTypeOf<v.InferInput<typeof inlineNotesStateInput>>().toEqualTypeOf<{ noteId: string }>();
	expectTypeOf<v.InferOutput<typeof inlineNotesStateInput>>().toEqualTypeOf<{ noteId: string }>();
	expectTypeOf<v.InferInput<typeof inlineNotesStateOutput>>().toEqualTypeOf<{ isFavorited: boolean; isMutedThread: boolean }>();
	expectTypeOf<v.InferOutput<typeof inlineNotesStateOutput>>().toEqualTypeOf<{ isFavorited: boolean; isMutedThread: boolean }>();
	expect(v.parse(inlineNotesStateInput, input)).toEqual(input);
	for (const value of [{}, { noteId: 42 }, { noteId: 'bad-id' }]) {
		expect(v.safeParse(inlineNotesStateInput, value).success).toBe(false);
	}
	expect(v.parse(inlineNotesStateInput, { ...input, i: 'transport', future: true })).toEqual(input);
	expect(v.parse(inlineNotesStateOutput, output)).toEqual(output);
	for (const value of [{ isFavorited: true }, { ...output, isMutedThread: 1 }, { ...output, future: true }]) {
		expect(v.safeParse(inlineNotesStateOutput, value).success).toBe(false);
	}
});

test('native procedure strips transport fields and keeps authenticated actor separate', async () => {
	const params = { ...input, i: 'transport', future: true };
	const user = mockDeep<MiLocalUser>({ id: 'user123', isSuspended: false, movedToUri: null });
	const context = mockDeep<NotesApiContext<MiLocalUser>>({ credential: 'fixture', ip: '127.0.0.1', headers: {} });
	context.services.authenticate.mockResolvedValue([user, null]);
	context.operations.notes.notesState.mockResolvedValue(output);
	const client = createProcedureClient(createNotesStateProcedure<MiLocalUser>(), { context });
	expect(await client(params)).toEqual(output);
	expect(context.operations.notes.notesState).toHaveBeenCalledWith(input, user);
	expect(notesStateContract['~orpc'].inputSchema).toBe(inlineNotesStateInput);
	expect(notesStateContract['~orpc'].outputSchema).toBe(inlineNotesStateOutput);
});

test('native procedure requires authentication and validates the operation response', async () => {
	const context = mockDeep<NotesApiContext<MiLocalUser>>({ credential: null, ip: '127.0.0.1', headers: {} });
	context.services.authenticate.mockResolvedValue([null, null]);
	const client = createProcedureClient(createNotesStateProcedure<MiLocalUser>(), { context });
	await expect(client(input)).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
	expect(context.operations.notes.notesState).not.toHaveBeenCalled();

	const user = mockDeep<MiLocalUser>({ id: 'user123', isSuspended: false, movedToUri: null });
	context.services.authenticate.mockResolvedValue([user, null]);
	const invalidOutput = { ...output, future: true };
	context.operations.notes.notesState.mockResolvedValue(invalidOutput);
	await expect(client(input)).rejects.toThrow();
});

test.each([
	{ threadId: null, favorite: 0, muting: 1 },
	{ threadId: 'thread123', favorite: 1, muting: 0 },
])('actual handler emits exactly two booleans and preserves thread fallback: $threadId', async ({ threadId, favorite, muting }) => {
	const notes = mockDeep<NotesRepository>();
	const favorites = mockDeep<NoteFavoritesRepository>();
	const mutings = mockDeep<NoteThreadMutingsRepository>();
	const note = mockDeep<MiNote>({ id: input.noteId, threadId });
	const user = mockDeep<MiLocalUser>({ id: 'user123' });
	notes.findOneByOrFail.mockResolvedValue(note);
	favorites.count.mockResolvedValue(favorite);
	mutings.count.mockResolvedValue(muting);
	const endpoint = new NotesStateOperation(notes, mutings, favorites);
	const result = await endpoint.execute(input, user);
	expectTypeOf(result).toEqualTypeOf<{ isFavorited: boolean; isMutedThread: boolean }>();
	expect(result).toEqual({ isFavorited: favorite !== 0, isMutedThread: muting !== 0 });
	expect(v.parse(inlineNotesStateOutput, result)).toEqual(result);
	expect(notes.findOneByOrFail).toHaveBeenCalledWith({ id: input.noteId });
	expect(favorites.count).toHaveBeenCalledWith({ where: { userId: user.id, noteId: note.id }, take: 1 });
	expect(mutings.count).toHaveBeenCalledWith({ where: { userId: user.id, threadId: threadId ?? note.id }, take: 1 });
});
