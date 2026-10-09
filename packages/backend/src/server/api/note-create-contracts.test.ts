/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { expect, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { createProcedureClient } from '@orpc/server';
import { mockDeep } from 'vitest-mock-extended';
import { notesCreateContract, notesCreateErrors, notesCreatePolicy } from '@features/notes/backend/endpoints/notes/create.contract.js';
import { NotesCreateOperation, createNotesCreateProcedure } from '@features/notes/backend/endpoints/notes/create.js';
import { MAX_NOTE_TEXT_LENGTH } from '@features/notes/backend/request.schema.js';
import { packedNoteSchema } from '@features/notes/backend/note.schema.js';
import { genPilotOpenapiSpec } from '@features/api/backend/transport/openapi/pilot-spec.js';
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
import baseline from '../../../test/fixtures/note-create-contract-baseline.json' with { type: 'json' };
import type { NotesApiContext } from '@features/notes/backend/operations.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import type { NoteCreateService } from '@features/notes/backend/services/NoteCreateService.js';
import type { MiNote } from '@features/notes/backend/models/Note.js';

const defaults = { visibility: 'public', localOnly: false, reactionAcceptance: null, noExtractMentions: false, noExtractHashtags: false, noExtractEmojis: false };
const packedNote = {
	id: 'note123', createdAt: '2026-10-09T00:00:00.000Z', text: 'hello', userId: 'user123',
	user: { id: 'user123', name: null, username: 'alice', host: null, avatarUrl: 'https://example.com/avatar.png', avatarBlurhash: null, avatarDecorations: [], emojis: {}, onlineStatus: 'unknown' },
	visibility: 'public', reactionAcceptance: null, reactionEmojis: {}, reactions: {}, reactionCount: 0, renoteCount: 0, repliesCount: 0,
} satisfies v.InferOutput<typeof packedNoteSchema>;

test('notes/create retains the frozen public limit, security policy and every route error ID', () => {
	expect(MAX_NOTE_TEXT_LENGTH).toBe(3000);
	expect(notesCreatePolicy).toEqual({
		name: 'notes/create', requireCredential: true, prohibitMoved: true,
		limit: baseline.routes[0].meta.limit, kind: 'write:notes',
	});
	expect(notesCreateErrors).toEqual(baseline.routes[0].meta.errors);
	expect(notesCreateContract['~orpc'].inputSchema).toBe(requiredSchema(notesCreateContract['~orpc'].inputSchema));
	expect(notesCreateContract['~orpc'].outputSchema).toBe(requiredSchema(notesCreateContract['~orpc'].outputSchema));
});

test('text conditional preserves whitespace with attachments while ordinary validation remains active', () => {
	for (const content of [{ renoteId: 'renote1' }, { fileIds: ['file1'] }, { mediaIds: ['file2'] }, { poll: { choices: ['a', 'b'] } }]) {
		for (const text of [undefined, null, ' ']) expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), text === undefined ? content : { ...content, text }).success).toBe(true);
		for (const text of ['', 'x'.repeat(3001)]) expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { ...content, text }).success).toBe(false);
	}
	for (const body of [{}, { text: null }, { text: '' }, { text: ' ' }, { replyId: 'reply1' }, { channelId: 'channel1' }, { renoteId: null, poll: null }]) expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), body).success).toBe(false);
	for (const files of [{ fileIds: [] }, { mediaIds: [] }, { fileIds: null }, { mediaIds: null }]) expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { ...files, text: 'x', renoteId: 'renote1' }).success).toBe(false);
});

test('only the six original root defaults are filled; attachment and poll defaults remain absent', () => {
	expect(v.parse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { text: 'x' })).toEqual({ text: 'x', ...defaults });
	expect(v.parse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { poll: { choices: ['a', 'b'] } }).poll).toEqual({ choices: ['a', 'b'] });
	for (const visibility of ['public', 'home', 'followers', 'specified']) expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { text: 'x', visibility }).success).toBe(true);
	for (const visibility of ['private', null, 1]) expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { text: 'x', visibility }).success).toBe(false);
	for (const field of ['localOnly', 'noExtractMentions', 'noExtractHashtags', 'noExtractEmojis']) {
		for (const value of [true, false]) expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { text: 'x', [field]: value }).success).toBe(true);
		for (const value of [null, 'false', 0]) expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { text: 'x', [field]: value }).success).toBe(false);
	}
});

test('native Unicode text, warning and poll limits count code points and reject duplicate IDs', () => {
	for (const text of ['x'.repeat(3000), '😀'.repeat(3000)]) expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { text }).success).toBe(true);
	for (const text of ['x'.repeat(3001), '😀'.repeat(3001)]) expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { text }).success).toBe(false);
	for (const cw of [' ', 'x'.repeat(100), '😀'.repeat(100), null]) expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { text: 'x', cw }).success).toBe(true);
	for (const cw of ['', 'x'.repeat(101), '😀'.repeat(101), 1]) expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { text: 'x', cw }).success).toBe(false);
	for (const field of ['visibleUserIds', 'fileIds', 'mediaIds']) {
		expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { text: 'x', [field]: ['valid1'] }).success).toBe(true);
		for (const ids of [['valid1', 'valid1'], ['bad-id'], [1], null]) expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { text: 'x', [field]: ids }).success).toBe(false);
	}
	for (const choices of [['a', 'b'], ['😀'.repeat(50), 'b'], Array.from({ length: 10 }, (_, i) => String(i))]) expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { poll: { choices } }).success).toBe(true);
	for (const choices of [[], ['a'], ['a', 'a'], ['', 'b'], ['😀'.repeat(51), 'b'], Array.from({ length: 11 }, (_, i) => String(i))]) expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { poll: { choices } }).success).toBe(false);
	for (const field of ['fileIds', 'mediaIds']) expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { text: 'x', [field]: Array.from({ length: 17 }, (_, i) => `file${i}`) }).success).toBe(false);
});

test('root and poll unknown own keys are stripped safely without mutating caller objects', () => {
	const extras = { constructor: { keep: true }, prototype: { keep: true }, toString: { keep: true }, future: true };
	const input = { ...extras, i: 'transport', poll: { choices: ['a', 'b'], ...extras } };
	const before = structuredClone(input);
	const parsed = v.parse(requiredSchema(notesCreateContract['~orpc'].inputSchema), input);
	expect(parsed).toEqual({ ...defaults, poll: { choices: ['a', 'b'] } });
	expect(input).toEqual(before);
	expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
	expect(Object.getPrototypeOf(parsed.poll)).toBe(Object.prototype);
	for (const invalid of [[], Object.assign([], { text: 'x' }), { poll: Object.assign([], { choices: ['a', 'b'] }) }]) expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), invalid).success).toBe(false);
});

test('poll expiry stays finite and integral without coercion', () => {
	for (const number of [NaN, Infinity, -Infinity, 1.5, '1']) for (const key of ['expiresAt', 'expiredAfter']) expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { poll: { choices: ['a', 'b'], [key]: number } }).success).toBe(false);
	for (const expiresAt of [-1, 0, 1, null]) expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { poll: { choices: ['a', 'b'], expiresAt } }).success).toBe(true);
	for (const expiredAfter of [1, null]) expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { poll: { choices: ['a', 'b'], expiredAfter } }).success).toBe(true);
	for (const expiredAfter of [-1, 0]) expect(v.safeParse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { poll: { choices: ['a', 'b'], expiredAfter } }).success).toBe(false);
});

test('native inference retains the complete Note and exact defaulted handler fields', () => {
	expectTypeOf<InferSchemaOutput<NonNullable<typeof notesCreateContract['~orpc']['outputSchema']>>['createdNote']>().toEqualTypeOf<v.InferOutput<typeof packedNoteSchema>>();
	expectTypeOf<InferSchemaOutput<NonNullable<typeof notesCreateContract['~orpc']['inputSchema']>>['visibility']>().toEqualTypeOf<'public' | 'home' | 'followers' | 'specified'>();
	expectTypeOf<InferSchemaOutput<NonNullable<typeof notesCreateContract['~orpc']['inputSchema']>>['localOnly']>().toEqualTypeOf<boolean>();
	expectTypeOf<InferSchemaOutput<NonNullable<typeof notesCreateContract['~orpc']['inputSchema']>>['noExtractMentions']>().toEqualTypeOf<boolean>();
	expectTypeOf<InferSchemaOutput<NonNullable<typeof notesCreateContract['~orpc']['inputSchema']>>['text']>().toEqualTypeOf<string | null | undefined>();
});

function contextFixture() {
	const actor = mockDeep<MiLocalUser>({ id: 'user123', isSuspended: false, movedToUri: null });
	const context = mockDeep<NotesApiContext<MiLocalUser>>({ credential: 'fixture', ip: '127.0.0.1', headers: {} });
	context.services.authenticate.mockResolvedValue([actor, null]);
	context.services.limitActor.mockReturnValue(null);
	context.services.rateLimitFactor.mockResolvedValue(1);
	context.operations.notes.notesCreate.mockResolvedValue({ createdNote: packedNote });
	return { context, actor, client: createProcedureClient(createNotesCreateProcedure<MiLocalUser>(), { context }) };
}

test('native procedure validates before application side effects and passes parsed defaults with the trusted actor', async () => {
	const { context, actor, client } = contextFixture();
	await expect(client({ text: '' })).rejects.toThrow();
	expect(context.operations.notes.notesCreate).not.toHaveBeenCalled();
	const input = { text: 'hello', i: 'transport', actor: { id: 'spoofed' }, future: true };
	expect(await client(input)).toEqual({ createdNote: packedNote });
	expect(context.operations.notes.notesCreate).toHaveBeenCalledWith({ text: 'hello', ...defaults }, actor);
	const invalidOutput = { createdNote: packedNote, future: true };
	context.operations.notes.notesCreate.mockResolvedValue(invalidOutput);
	await expect(client({ text: 'hello' })).rejects.toThrow();
});

test('authentication and moved-account checks run before input validation or application calls', async () => {
	const { context, actor, client } = contextFixture();
	context.services.authenticate.mockResolvedValue([null, null]);
	await expect(client({ text: '' })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
	context.services.authenticate.mockResolvedValue([{ ...actor, movedToUri: 'https://example.com/users/moved' }, null]);
	await expect(client({ text: '' })).rejects.toMatchObject({ code: 'YOUR_ACCOUNT_MOVED' });
	expect(context.operations.notes.notesCreate).not.toHaveBeenCalled();
});

test('application operation retains file precedence, poll defaults, extraction controls and validates its envelope', async () => {
	const entities = mockDeep<NoteEntityService>();
	const create = mockDeep<NoteCreateService>();
	const actor = mockDeep<MiLocalUser>({ id: 'user123' });
	const note = mockDeep<MiNote>({ id: packedNote.id });
	create.fetchAndCreate.mockResolvedValue(note);
	entities.pack.mockResolvedValue(packedNote);
	const operation = new NotesCreateOperation(entities, create);
	const input = v.parse(requiredSchema(notesCreateContract['~orpc'].inputSchema), { fileIds: ['file1'], mediaIds: ['media1'], poll: { choices: ['a', 'b'] }, noExtractMentions: true });
	expect(await operation.execute(input, actor)).toEqual({ createdNote: packedNote });
	expect(create.fetchAndCreate).toHaveBeenCalledWith(actor, expect.objectContaining({ fileIds: ['file1'], poll: { choices: ['a', 'b'], multiple: false, expiresAt: null }, apMentions: [], apHashtags: undefined, apEmojis: undefined }));
	expect(entities.pack).toHaveBeenCalledWith(note, actor);
	create.fetchAndCreate.mockRejectedValue(new IdentifiableError('689ee33f-f97c-479a-ac49-1b9f8140af99'));
	await expect(operation.execute(input, actor)).rejects.toMatchObject({ code: notesCreateErrors.containsProhibitedWords.code, data: { id: notesCreateErrors.containsProhibitedWords.id } });
});

test('native OpenAPI generator documents notes/create auth, route errors and the 200 envelope', async () => {
	const spec = await genPilotOpenapiSpec({ version: 'note-create-contract-test', apiUrl: 'https://note-create-contract.test/api' });
	const operation = spec.paths?.['/notes/create']?.post;
	expect(operation).toBeDefined();
	expect(operation?.security).toEqual([{ bearerAuth: [] }]);
	expect(operation?.tags).toEqual(['notes']);
	expect(operation?.responses).toHaveProperty('200');
	expect(operation?.responses).toHaveProperty('400');
	expect(operation?.responses).toHaveProperty('401');
});

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
