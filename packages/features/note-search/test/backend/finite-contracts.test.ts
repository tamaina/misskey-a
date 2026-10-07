/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedNotesSearchInput, packedNotesSearchDefinition, packedNotesSearchOutput } from '../../contract/index.js';
import { EndpointImplementation as Search } from '../../backend/endpoints/notes/search.js';

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
	const output = await endpoint.exec({ query: 'hello' }, null, null);
	expect(output).toBe(response);
	expect(v.parse(packedNotesSearchOutput, output)).toEqual(response);
	expect(search.searchNote).toHaveBeenCalledWith('hello', null, expect.objectContaining({ userId: null, channelId: null }), expect.objectContaining({ limit: 10 }));
});

test('finite search input strips extras and validates required fields; HTTP keeps unknown keys and unparsed Note extras', async () => {
	const parsed: v.InferOutput<typeof packedNotesSearchInput> = v.parse(packedNotesSearchInput, { query: 'hello', future: true });
	expect(parsed).toEqual({ query: 'hello', limit: 10, offset: 0, userId: null, channelId: null });
	for (const value of [{}, { query: 7 }, { query: 'hello', limit: 0 }, { query: 'hello', sinceId: '-' }]) expect(v.safeParse(packedNotesSearchInput, value).success).toBe(false);
	const projection = projectEndpointContract(packedNotesSearchDefinition);
	const params = { query: 'hello', future: true };
	const response = [{ ...note, future: true }];
	const endpoint = new ContractEndpoint({}, projection, async ps => { expect(ps).toBe(params); return response; });
	expect(await endpoint.exec(params, null, null)).toBe(response);
	expect(params).toMatchObject({ future: true, limit: 10, offset: 0 });
	await expect(endpoint.exec({}, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM', info: { param: '#/required' } });
});
