/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { createNotesShowProcedure } from '../../backend/endpoints/notes/show.js';
import type { NotesShowDependencies } from '../../backend/endpoints/notes/show.js';
import { notesShowContract } from '../../backend/endpoints/notes/show.contract.js';
import * as v from 'valibot';
import { packedNoteSchema, toPackedNote } from '../../backend/note.schema.js';
import type { PackedNote } from '../../backend/note.schema.js';
import type { MiNote } from '../../backend/models/Note.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { PackedUserLite } from '@features/users/backend/user.schema.js';

const user: PackedUserLite = {
	id: 'author1', name: 'Author', username: 'author', host: null, avatarUrl: '/avatar.png',
	avatarBlurhash: null, avatarDecorations: [], emojis: {}, onlineStatus: 'unknown',
};
const file = {
	id: 'file1', createdAt: '2026-01-01T00:00:00.000Z', name: 'file.txt', type: 'text/plain', md5: 'hash',
	size: 5, isSensitive: false, blurhash: null, properties: {}, url: '/file.txt', thumbnailUrl: null,
	comment: null, folderId: null, folder: null, userId: null, user: null,
};
const note: PackedNote = {
	id: 'note1', createdAt: '2026-01-01T00:00:00.000Z', text: '😀', userId: user.id, user,
	visibility: 'public', reactionAcceptance: null, reactionEmojis: {}, reactions: {},
	reactionCount: 0, renoteCount: 0, repliesCount: 0, files: [file], reply: null, renote: null,
};

afterEach(() => vi.restoreAllMocks());

test('note HTTP recursively selects public user, file and reply DTOs with no output validator calls', async () => {
	const deps = mockDeep<NotesShowDependencies>();
	deps.serverSettings.ugcVisibilityForVisitor = 'all';
	deps.getterService.getNoteWithRelations.mockResolvedValue(mockDeep<MiNote>({ user: { requireSigninToViewContents: false }, userHost: null }));
	const packed = { ...note, accessKey: 'outer-secret',
		user: { ...user, email: 'private@example.test', token: 'user-secret' },
		files: [{ ...file, accessKey: 'file-secret', properties: { width: 12, requestHeaders: { private: 'property-secret' } } }],
		reply: { ...note, requestHeaders: { private: 'reply-secret' } },
	};
	deps.noteEntityService.pack.mockResolvedValue(packed);
	const schema = notesShowContract['~orpc'].outputSchema;
	if (!schema) throw new Error('Missing note output schema');
	const output = vi.spyOn(schema['~standard'], 'validate');
	const context: ApiContext<MiLocalUser> = {
		credential: null, ip: '127.0.0.1', headers: {},
		services: { authenticate: async () => [null, null], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null },
	};
	const handler = new OpenAPIHandler({ show: createNotesShowProcedure(deps) });
	const result = await handler.handle(new Request('https://local.test/notes/show', {
		method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ noteId: 'note1', future: true }),
	}), { context });
	if (!result.response) throw new Error('Expected notes/show response');
	expect(result.response.status).toBe(200);
	expect(await result.response.json()).toEqual({ ...note, files: [{ ...file, properties: { width: 12 } }], reply: note });
	expect(output).not.toHaveBeenCalled();
});

test('ordinary note records keep the prior reserved-key normalization without mutating input', () => {
	const strings = JSON.parse('{"constructor":"hidden","prototype":"hidden","__proto__":"hidden","emoji":"/emoji"}');
	const numbers = JSON.parse('{"constructor":2,"prototype":3,"__proto__":4,"emoji":1}');
	const input = { ...note, emojis: strings, reactionEmojis: strings, reactions: numbers };
	expect(toPackedNote(input)).toEqual(v.parse(packedNoteSchema, input));
	expect(toPackedNote(input).reactions).toEqual({ emoji: 1 });
	expect(Object.keys(input.reactions)).toEqual(['constructor', 'prototype', '__proto__', 'emoji']);
});
