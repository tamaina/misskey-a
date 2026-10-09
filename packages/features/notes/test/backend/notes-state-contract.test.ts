/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaInput, InferSchemaOutput } from '@orpc/contract';
import { expect, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { createProcedureClient } from '@orpc/server';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import { notesStateContract } from '../../backend/endpoints/notes/state.contract.js';
import { createNotesStateProcedure as NotesStateOperation, createNotesStateProcedure } from '../../backend/endpoints/notes/state.js';
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
test('native procedure strips transport fields and uses the authenticated principal in repository queries', async () => {
	const user = mockDeep<MiLocalUser>({ id: 'user123', isSuspended: false, movedToUri: null });
	const deps = mockDeep<Parameters<typeof createNotesStateProcedure>[0]>();
	deps.notesRepository.findOneByOrFail.mockResolvedValue(mockDeep<MiNote>({ id: input.noteId, threadId: null }));
	deps.noteFavoritesRepository.count.mockResolvedValue(1);
	deps.noteThreadMutingsRepository.count.mockResolvedValue(0);
	const client = createProcedureClient(createNotesStateProcedure(deps), { context: apiTestContext(user) });
	const params = { ...input, i: 'transport', actor: { id: 'forged' }, future: true };
	expect(await client(params)).toEqual(output);
	expect(deps.notesRepository.findOneByOrFail).toHaveBeenCalledWith({ id: input.noteId });
	expect(deps.noteFavoritesRepository.count).toHaveBeenCalledWith({ where: { userId: user.id, noteId: input.noteId }, take: 1 });
});
test('native procedure requires authentication before querying repositories', async () => {
	const deps = mockDeep<Parameters<typeof createNotesStateProcedure>[0]>();
	const client = createProcedureClient(createNotesStateProcedure(deps), { context: apiTestContext(null) });
	await expect(client(input)).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
	expect(deps.notesRepository.findOneByOrFail).not.toHaveBeenCalled();
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
	const endpoint = NotesStateOperation({ notesRepository: notes, noteThreadMutingsRepository: mutings, noteFavoritesRepository: favorites });
	const result = await createProcedureClient(endpoint, { context: apiTestContext(user) })(input);
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

function apiTestContext(actor: MiLocalUser | null): ApiContext<MiLocalUser> {
	if (actor !== null) { actor.isSuspended = false; actor.movedToUri = null; }
	const context = mockDeep<ApiContext<MiLocalUser>>({ credential: actor ? 'fixture' : null, ip: '127.0.0.1', headers: {} });
	context.services.authenticate.mockResolvedValue([actor, null]);
	context.services.limitActor.mockReturnValue(null);
	return context;
}
