/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaInput, InferSchemaOutput } from '@orpc/contract';
import { expect, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { createProcedureClient } from '@orpc/server';
import { notesStateContract } from '../../backend/endpoints/notes/state.contract.js';
import { NotesStateOperation, createNotesStateProcedure } from '../../backend/endpoints/notes/state.js';
import type { NotesApiContext } from '../../backend/operations.js';
import type { NotesRepository, NoteThreadMutingsRepository, NoteFavoritesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiNote } from '@features/notes/backend/models/Note.js';

const input = { noteId: 'abc123' };
const output = { isFavorited: true, isMutedThread: false };

test('native input and output infer their complete explicit properties', () => {
	expectTypeOf<InferSchemaInput<NonNullable<typeof notesStateContract['~orpc']['inputSchema']>>>().toEqualTypeOf<{ noteId: string } & object>();
	expectTypeOf<InferSchemaOutput<NonNullable<typeof notesStateContract['~orpc']['inputSchema']>>>().toEqualTypeOf<{ noteId: string }>();
	expectTypeOf<InferSchemaInput<NonNullable<typeof notesStateContract['~orpc']['outputSchema']>>>().toEqualTypeOf<{ isFavorited: boolean; isMutedThread: boolean }>();
	expectTypeOf<InferSchemaOutput<NonNullable<typeof notesStateContract['~orpc']['outputSchema']>>>().toEqualTypeOf<{ isFavorited: boolean; isMutedThread: boolean }>();
	expect(v.parse(requiredSchema(notesStateContract['~orpc'].inputSchema), input)).toEqual(input);
	for (const value of [{}, { noteId: 42 }, { noteId: 'bad-id' }]) {
		expect(v.safeParse(requiredSchema(notesStateContract['~orpc'].inputSchema), value).success).toBe(false);
	}
	expect(v.parse(requiredSchema(notesStateContract['~orpc'].inputSchema), { ...input, i: 'transport', future: true })).toEqual(input);
	expect(v.parse(requiredSchema(notesStateContract['~orpc'].outputSchema), output)).toEqual(output);
	for (const value of [{ isFavorited: true }, { ...output, isMutedThread: 1 }, { ...output, future: true }]) {
		expect(v.safeParse(requiredSchema(notesStateContract['~orpc'].outputSchema), value).success).toBe(false);
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
	expect(v.parse(requiredSchema(notesStateContract['~orpc'].outputSchema), result)).toEqual(result);
	expect(notes.findOneByOrFail).toHaveBeenCalledWith({ id: input.noteId });
	expect(favorites.count).toHaveBeenCalledWith({ where: { userId: user.id, noteId: note.id }, take: 1 });
	expect(mutings.count).toHaveBeenCalledWith({ where: { userId: user.id, threadId: threadId ?? note.id }, take: 1 });
});

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
