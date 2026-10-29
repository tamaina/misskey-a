/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { notesSearchContract } from '../../backend/endpoints/notes/search.contract.js';
import { createNotesSearchProcedure, type NotesSearchDependencies } from '../../backend/endpoints/notes/search.js';
import { createProcedureClient } from '@orpc/server';
import type { ApiServices } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

function requiredSchema<S extends v.GenericSchema>(schema: S | undefined): S {
	if (schema === undefined) throw new Error('Missing native contract schema');
	return schema;
}

const packedNotesSearchInput = requiredSchema(notesSearchContract['~orpc'].inputSchema);
const packedNotesSearchOutput = requiredSchema(notesSearchContract['~orpc'].outputSchema);

const user = { id: 'user123', name: null, username: 'alice', host: null, avatarUrl: 'https://example/avatar', avatarBlurhash: null, avatarDecorations: [], emojis: {}, onlineStatus: 'unknown' as const };
const note = { id: 'note123', createdAt: '2026-01-01T00:00:00Z', text: null, userId: user.id, user, visibility: 'public' as const, reactionAcceptance: null, reactionEmojis: {}, reactions: {}, reactionCount: 0, renoteCount: 0, repliesCount: 0 };

test.each([false, true])('actual search handler preserves packed Note arrays including empty results: %s', async empty => {
	const notes = mockDeep<NotesSearchDependencies['noteEntityService']>();
	const search = mockDeep<NotesSearchDependencies['searchService']>();
	const roles = mockDeep<NotesSearchDependencies['roleService']>();
	roles.getUserPolicies.mockResolvedValue(mockDeep<Awaited<ReturnType<NotesSearchDependencies['roleService']['getUserPolicies']>>>({ canSearchNotes: true }));
	search.searchNote.mockResolvedValue([]);
	const response = empty ? [] : [note];
	notes.packMany.mockResolvedValue(response);
	const services = mockDeep<ApiServices<MiLocalUser>>();
	services.authenticate.mockResolvedValue([null, null]);
	const endpoint = createProcedureClient(createNotesSearchProcedure<MiLocalUser>({ noteEntityService: notes, searchService: search, roleService: roles, idService: mockDeep() }), { context: { services, credential: null, ip: '127.0.0.1', headers: {} } });
	const output = await endpoint({ query: 'hello' });
	expect(output).toEqual(response);
	expect(v.parse(packedNotesSearchOutput, output)).toEqual(response);
	expect(search.searchNote).toHaveBeenCalledWith('hello', null, expect.objectContaining({ userId: null, channelId: null }), expect.objectContaining({ limit: 10 }));
});

test('native search defaults, scalar types and nullable filters preserve the public wire input', () => {
	const parsed = v.parse(packedNotesSearchInput, { query: 'hello', future: true });
	expect(parsed).toEqual({ query: 'hello', limit: 10, offset: 0, userId: null, channelId: null });
	for (const value of [[], {}, { query: 7 }, { query: 'hello', limit: 0 }, { query: 'hello', sinceId: '-' }]) expect(v.safeParse(packedNotesSearchInput, value).success).toBe(false);
	expect(v.parse(packedNotesSearchInput, { query: 'hello', rangeStartAt: null, rangeEndAt: null })).toMatchObject({ rangeStartAt: null, rangeEndAt: null });
	expect(v.safeParse(packedNotesSearchOutput, [{ ...note, future: true }]).success).toBe(false);
});

test('anonymous search observes role policy before querying and retains the unavailable error UUID', async () => {
	const search = mockDeep<NotesSearchDependencies['searchService']>();
	const roles = mockDeep<NotesSearchDependencies['roleService']>();
	roles.getUserPolicies.mockResolvedValue(mockDeep<Awaited<ReturnType<NotesSearchDependencies['roleService']['getUserPolicies']>>>({ canSearchNotes: false }));
	const services = mockDeep<ApiServices<MiLocalUser>>();
	services.authenticate.mockResolvedValue([null, null]);
	const service = createProcedureClient(createNotesSearchProcedure<MiLocalUser>({ noteEntityService: mockDeep(), searchService: search, roleService: roles, idService: mockDeep() }), { context: { services, credential: null, ip: '127.0.0.1', headers: {} } });
	await expect(service({ query: 'hello' })).rejects.toMatchObject({ code: 'UNAVAILABLE', data: { id: '0b44998d-77aa-4427-80d0-d2c9b8523011' } });
	expect(roles.getUserPolicies).toHaveBeenCalledWith(null);
	expect(search.searchNote).not.toHaveBeenCalled();
});
