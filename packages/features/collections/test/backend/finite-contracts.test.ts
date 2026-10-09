/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { createRouterClient } from '@orpc/server';
import { packedClipSchema, packedNoteFavoriteSchema, packedGalleryPostSchema, packedClipsCreateInput, packedClipsListInput, collectionsOutputs, uniqueGalleryPostsCreateInput } from '../../backend/api.schema.js';
import { createApiRouter } from '../../../index/backend/api.router.js';
import { normalizeError } from '../../../api/backend/transport/orpc-error.js';

import { ClipEntityService } from '../../backend/serializers/ClipEntityService.js';
import { GalleryPostEntityService } from '../../backend/serializers/GalleryPostEntityService.js';
import { GalleryLikeEntityService } from '../../backend/serializers/GalleryLikeEntityService.js';
import { NoteFavoriteEntityService } from '../../backend/serializers/NoteFavoriteEntityService.js';
import type { ApiActor } from '../../../api/backend/transport/context.js';
import type { ApiExecutionContext } from '../../../index/backend/api.context.js';
import type { MiClip } from '../../backend/models/Clip.js';
import type { MiGalleryPost } from '../../backend/models/GalleryPost.js';
import type { MiGalleryLike } from '../../backend/models/GalleryLike.js';
import type { MiNoteFavorite } from '../../backend/models/NoteFavorite.js';

const packedIGalleryLikesOutput = collectionsOutputs.iGalleryLikes;
const date = new Date('2026-01-01T00:00:00Z');
const user = { id: 'user123', name: null, username: 'alice', host: null, avatarUrl: 'https://example/avatar', avatarBlurhash: null, avatarDecorations: [], emojis: {}, onlineStatus: 'unknown' as const };
const note = { id: 'note123', createdAt: date.toISOString(), text: null, userId: user.id, user, visibility: 'public' as const, reactionAcceptance: null, reactionEmojis: {}, reactions: {}, reactionCount: 0, renoteCount: 0, repliesCount: 0 };

function checkClosed(schema: v.GenericSchema, value: Record<string, unknown>, required: string, wrong: Record<string, unknown>) {
	expect(v.safeParse(schema, value).success).toBe(true);
	expect(v.safeParse(schema, { ...value, future: true }).success).toBe(false);
	const missing = { ...value };
	delete missing[required];
	expect(v.safeParse(schema, missing).success).toBe(false);
	expect(v.safeParse(schema, { ...value, ...wrong }).success).toBe(false);
}

test.each([null, { id: 'other123' }, { id: user.id }])('actual Clip producer retains anonymous/viewer/owner variants: %j', async me => {
	const favorites = mockDeep<ConstructorParameters<typeof ClipEntityService>[2]>();
	const clipNotes = mockDeep<ConstructorParameters<typeof ClipEntityService>[1]>();
	favorites.countBy.mockResolvedValue(2);
	favorites.exists.mockResolvedValue(true);
	clipNotes.countBy.mockResolvedValue(3);
	const users = mockDeep<ConstructorParameters<typeof ClipEntityService>[3]>();
	users.pack.mockResolvedValue(user);
	const ids = mockDeep<ConstructorParameters<typeof ClipEntityService>[4]>();
	ids.parse.mockReturnValue({ date });
	const service = new ClipEntityService(mockDeep(), clipNotes, favorites, users, ids);
	const clip: MiClip = mockDeep<MiClip>({ id: 'clip123', userId: user.id, user: null, name: 'saved', description: null, isPublic: true, lastClippedAt: null });
	const output = await service.pack(clip, me);
	checkClosed(packedClipSchema, output, 'name', { favoritedCount: '2' });
	expect(output.lastClippedAt).toBeNull();
	expect(output.isFavorited).toBe(me ? true : undefined);
	expect(output.notesCount).toBe(me?.id === user.id ? 3 : undefined);
	clip.lastClippedAt = date;
	expect(v.parse(packedClipSchema, await service.pack(clip, me)).lastClippedAt).toBe(date.toISOString());
});

test.each([false, true])('actual gallery producer and like wrapper preserve optional viewer fields: %s', async authenticated => {
	const users = mockDeep<ConstructorParameters<typeof GalleryPostEntityService>[2]>();
	users.pack.mockResolvedValue(user);
	const files = mockDeep<ConstructorParameters<typeof GalleryPostEntityService>[3]>();
	files.packManyByIds.mockResolvedValue([]);
	const ids = mockDeep<ConstructorParameters<typeof GalleryPostEntityService>[4]>();
	ids.parse.mockReturnValue({ date });
	const likes = mockDeep<ConstructorParameters<typeof GalleryPostEntityService>[1]>();
	likes.exists.mockResolvedValue(true);
	const service = new GalleryPostEntityService(mockDeep(), likes, users, files, ids);
	const post = mockDeep<MiGalleryPost>({ id: 'post123', updatedAt: date, userId: user.id, user: null, title: 'gallery', description: null, fileIds: [], tags: [], isSensitive: false, likedCount: 2 });
	const me = authenticated ? user : null;
	const output = await service.pack(post, me);
	checkClosed(packedGalleryPostSchema, output, 'title', { likedCount: '2' });
	expect(output.tags).toBeUndefined();
	expect(output.isLiked).toBe(authenticated ? true : undefined);
	post.tags = ['tag'];
	expect(v.parse(packedGalleryPostSchema, await service.pack(post, me)).tags).toEqual(['tag']);
	const likeService = new GalleryLikeEntityService(mockDeep(), service);
	const like = await likeService.pack(mockDeep<MiGalleryLike>({ id: 'like123', post }), me);
	expect(v.parse(packedIGalleryLikesOutput, [like])).toEqual([{
		id: 'like123',
		post: {
			id: 'post123', createdAt: date.toISOString(), updatedAt: date.toISOString(), userId: user.id, user,
			title: 'gallery', description: null, fileIds: [], files: [], tags: ['tag'],
			isSensitive: false, likedCount: 2, isLiked: authenticated ? true : undefined,
		},
	}]);
	for (const value of [{ ...like, future: true }, { id: like.id }, { ...like, id: 7 }]) expect(v.safeParse(packedIGalleryLikesOutput, [value]).success).toBe(false);
});

test('actual favorite wrapper closes its own fields while preserving the nested Note schema', async () => {
	const notes = mockDeep<ConstructorParameters<typeof NoteFavoriteEntityService>[1]>();
	notes.pack.mockResolvedValue(note);
	const ids = mockDeep<ConstructorParameters<typeof NoteFavoriteEntityService>[2]>();
	ids.parse.mockReturnValue({ date });
	const service = new NoteFavoriteEntityService(mockDeep(), notes, ids);
	const output = await service.pack(mockDeep<MiNoteFavorite>({ id: 'favorite123', noteId: note.id, note: null }), user);
	checkClosed(packedNoteFavoriteSchema, output, 'noteId', { createdAt: 7 });
	expect(notes.pack).toHaveBeenCalledWith(note.id, user);
});

test('native finite inputs strip extras, enforce constraints, and retain defaults; operations and responses are validated', async () => {
	expect(v.parse(packedClipsCreateInput, { name: 'saved', future: true })).toEqual({ name: 'saved', isPublic: false });
	for (const value of [{}, { name: '' }, { name: 7 }, { name: 'saved', isPublic: null }]) expect(v.safeParse(packedClipsCreateInput, value).success).toBe(false);
	expect(v.parse(uniqueGalleryPostsCreateInput, { title: 'gallery', fileIds: ['file123'], future: true })).toEqual({ title: 'gallery', fileIds: ['file123'], isSensitive: false });
	for (const fileIds of [[], ['file123', 'file123'], [7]]) expect(v.safeParse(uniqueGalleryPostsCreateInput, { title: 'gallery', fileIds }).success).toBe(false);
	expect(v.parse(packedClipsListInput, { future: true })).toEqual({ limit: 10 });
	const params = { limit: 10, future: true };
	const nativeResponse = { id: 'clip123', createdAt: date.toISOString(), lastClippedAt: null, userId: user.id, user, name: 'saved', description: null, isPublic: true, favoritedCount: 2 };
	expect(v.safeParse(packedClipSchema, nativeResponse).success).toBe(true);
	const response = [{ ...nativeResponse, future: true }];
	const context = mockDeep<ApiExecutionContext<ApiActor>>();
	context.mapError = normalizeError;
	const actor: ApiActor = { id: user.id, isSuspended: false, movedToUri: null };
	context.services.authenticate.mockResolvedValue([actor, null]);
	context.operations.collections.clipsList.mockResolvedValue(response);
	const client = createRouterClient(createApiRouter<ApiActor>(), { context });
	await expect(client.collections.clipsList(params)).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
	expect(context.operations.collections.clipsList).toHaveBeenCalledWith({ limit: 10 }, actor);
	expect(params).toEqual({ future: true, limit: 10 });
	context.operations.collections.clipsList.mockResolvedValue([nativeResponse]);
	expect(await client.collections.clipsList({})).toEqual([nativeResponse]);
	const calls = context.operations.collections.clipsList.mock.calls.length;
	await expect(client.collections.clipsList({ limit: 0 })).rejects.toMatchObject({ code: 'INVALID_PARAM' });
	expect(context.operations.collections.clipsList.mock.calls).toHaveLength(calls);
});
