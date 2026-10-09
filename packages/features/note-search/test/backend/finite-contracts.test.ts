/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { notesSearchInput as packedNotesSearchInput, notesSearchOutput as packedNotesSearchOutput } from '../../backend/endpoints/notes/search.contract.js';
import { NotesSearchApplicationService as Search } from '../../backend/applications/notes/search.js';

const user = { id: 'user123', name: null, username: 'alice', host: null, avatarUrl: 'https://example/avatar', avatarBlurhash: null, avatarDecorations: [], emojis: {}, onlineStatus: 'unknown' as const };
const note = { id: 'note123', createdAt: '2026-01-01T00:00:00Z', text: null, userId: user.id, user, visibility: 'public' as const, reactionAcceptance: null, reactionEmojis: {}, reactions: {}, reactionCount: 0, renoteCount: 0, repliesCount: 0 };

test.each([false, true])('actual search handler preserves packed Note arrays including empty results: %s', async empty => {
	const notes = mockDeep<ConstructorParameters<typeof Search>[0]>();
	const search = mockDeep<ConstructorParameters<typeof Search>[1]>();
	const roles = mockDeep<ConstructorParameters<typeof Search>[2]>();
	roles.getUserPolicies.mockResolvedValue(mockDeep<Awaited<ReturnType<ConstructorParameters<typeof Search>[2]['getUserPolicies']>>>({ canSearchNotes: true }));
	search.searchNote.mockResolvedValue([]);
	const response = empty ? [] : [note];
	notes.packMany.mockResolvedValue(response);
	const endpoint = new Search(notes, search, roles, mockDeep());
	const output = await endpoint.execute(v.parse(packedNotesSearchInput, { query: 'hello' }), null);
	expect(output).toBe(response);
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
	const search = mockDeep<ConstructorParameters<typeof Search>[1]>();
	const roles = mockDeep<ConstructorParameters<typeof Search>[2]>();
	roles.getUserPolicies.mockResolvedValue(mockDeep<Awaited<ReturnType<ConstructorParameters<typeof Search>[2]['getUserPolicies']>>>({ canSearchNotes: false }));
	const service = new Search(mockDeep(), search, roles, mockDeep());
	await expect(service.execute(v.parse(packedNotesSearchInput, { query: 'hello' }), null)).rejects.toMatchObject({ code: 'UNAVAILABLE', data: { id: '0b44998d-77aa-4427-80d0-d2c9b8523011' } });
	expect(roles.getUserPolicies).toHaveBeenCalledWith(null);
	expect(search.searchNote).not.toHaveBeenCalled();
});
