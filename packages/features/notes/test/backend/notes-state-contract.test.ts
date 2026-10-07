/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { inlineNotesStateDefinition, inlineNotesStateInput, inlineNotesStateOutput } from '../../contract/endpoint-definitions.js';
import { EndpointImplementation, meta } from '../../backend/endpoints/notes/state.js';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import { convertSchemaToOpenApiSchema } from '@features/api/backend/transport/openapi/schemas.js';
import type { NotesRepository, NoteThreadMutingsRepository, NoteFavoritesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiNote } from '@features/notes/backend/models/Note.js';
import type { MiAccessToken } from '@features/auth/backend/models/AccessToken.js';

const projection = projectEndpointContract(inlineNotesStateDefinition);
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

test('JSON Schema leaves HTTP input open and documents the closed native output', () => {
	expect(projection.input).toEqual({
		type: 'object', properties: { noteId: { type: 'string', format: 'misskey:id' } }, required: ['noteId'],
	});
	expect(toLegacyJsonSchema(inlineNotesStateOutput, { target: 'openapi-3.0', typeMode: 'output' })).toEqual({
		type: 'object', properties: { isFavorited: { type: 'boolean' }, isMutedThread: { type: 'boolean' } },
		required: ['isFavorited', 'isMutedThread'], additionalProperties: false,
	});
	expect(convertSchemaToOpenApiSchema(projection.response!, 'res', true)).toEqual(toLegacyJsonSchema(inlineNotesStateOutput, { target: 'openapi-3.0', typeMode: 'output' }));
});

test('HTTP keeps original inputs, separate authentication and unparsed response identity', async () => {
	const params = { ...input, i: 'transport', future: true };
	const response = { ...output, future: true };
	const user = mockDeep<MiLocalUser>({ id: 'user123' });
	const token = mockDeep<MiAccessToken>();
	const endpoint = new ContractEndpoint(meta, projection, async (ps, me, accessToken) => {
		expect(ps).toBe(params);
		expect(me).toBe(user);
		expect(accessToken).toBe(token);
		return response;
	});
	expect(await endpoint.exec(params, user, token)).toBe(response);
	expect(v.safeParse(inlineNotesStateOutput, response).success).toBe(false);
	for (const [params, info] of [
		[{}, { param: '#/required', reason: "must have required property 'noteId'" }],
		[{ noteId: 42 }, { param: '#/properties/noteId/type', reason: 'must be string' }],
		[{ noteId: 'bad-id' }, { param: '#/properties/noteId/format', reason: 'must match format "misskey:id"' }],
	]) {
		await expect(endpoint.exec(params, user, token)).rejects.toMatchObject({ code: 'INVALID_PARAM', id: '3d81ceae-475f-4600-b2a8-2bc116157532', info });
	}
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
	const endpoint = new EndpointImplementation(notes, mutings, favorites);
	const result = await endpoint.exec(input, user, null);
	expectTypeOf(result).toEqualTypeOf<{ isFavorited: boolean; isMutedThread: boolean }>();
	expect(result).toEqual({ isFavorited: favorite !== 0, isMutedThread: muting !== 0 });
	expect(v.parse(inlineNotesStateOutput, result)).toEqual(result);
	expect(notes.findOneByOrFail).toHaveBeenCalledWith({ id: input.noteId });
	expect(favorites.count).toHaveBeenCalledWith({ where: { userId: user.id, noteId: note.id }, take: 1 });
	expect(mutings.count).toHaveBeenCalledWith({ where: { userId: user.id, threadId: threadId ?? note.id }, take: 1 });
});
