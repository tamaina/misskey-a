/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterClient } from '@orpc/server';
import { createCollectionsRouter } from '../../../backend/built/features/collections/backend.js';

const actor = { id: 'alice', isSuspended: false, movedToUri: null };
const privateClip = { id: 'clip1', userId: 'bob', isPublic: false };

test('private clips are hidden from anonymous and unrelated callers before serialization or favorites', async () => {
	const operations = createCollectionsRouter({
		clipsRepository: { findOneBy: async () => privateClip },
		clipEntityService: { pack: async () => { assert.fail('Private clip must remain hidden'); } },
		clipFavoritesRepository: { exists: async () => { assert.fail('Private clip must not expose favorite status'); } },
	});
	for (const principal of [null, actor]) {
		await assert.rejects(nativeCall(operations, 'clipsShow', { clipId: 'clip1' }, principal), error =>
			error.code === 'NO_SUCH_CLIP' && error.data.id === 'c3c5fe33-d62c-44d2-9ea5-d997703f5c20');
		await assert.rejects(nativeCall(operations, 'clipsNotes', { clipId: 'clip1', limit: 10 }, principal), error =>
			error.code === 'NO_SUCH_CLIP' && error.data.id === '1d7645e6-2b6d-4635-b0fe-fe22b0e72e00');
	}
	await assert.rejects(nativeCall(operations, 'clipsFavorite', { clipId: 'clip1' }, actor), error =>
		error.code === 'NO_SUCH_CLIP' && error.data.id === '4c2aaeae-80d8-4250-9606-26cb1fdb77a5');
});

test('a clip favorite can be removed after its owner makes the clip private', async () => {
	const removed = [];
	const operations = createCollectionsRouter({
		clipsRepository: { findOneBy: async () => privateClip },
		clipFavoritesRepository: {
			findOneBy: async criteria => { assert.deepEqual(criteria, { clipId: 'clip1', userId: 'alice' }); return { id: 'favorite1' }; },
			delete: async id => { removed.push(id); },
		},
	});
	assert.equal(await nativeCall(operations, 'clipsUnfavorite', { clipId: 'clip1' }, actor), undefined);
	assert.deepEqual(removed, ['favorite1']);
});

test('note favorites enforce visibility before duplicate checks and insertion', async () => {
	const operations = createCollectionsRouter({
		getterService: { getNote: async () => ({ id: 'note1', userId: 'bob', userHost: null }) },
		noteEntityService: { isVisibleForMe: async () => false },
		noteFavoritesRepository: {
			exists: async () => { assert.fail('Hidden note must not expose duplicate state'); },
			insert: async () => { assert.fail('Hidden note must not be favorited'); },
		},
	});
	await assert.rejects(nativeCall(operations, 'notesFavoritesCreate', { noteId: 'note1' }, actor), error =>
		error.code === 'NO_SUCH_NOTE' && error.data.id === '6dd26674-e060-4816-909a-45ba3f4da458');
});

test('favoriting another local author awards the author after insertion, while remote and own notes do not', async t => {
	for (const note of [
		{ id: 'note1', userId: 'bob', userHost: null },
		{ id: 'note2', userId: 'remote', userHost: 'example.test' },
		{ id: 'note3', userId: 'alice', userHost: null },
	]) await t.test(note.id, async () => {
		const events = [];
		const operations = createCollectionsRouter({
			getterService: { getNote: async () => note },
			noteEntityService: { isVisibleForMe: async () => true },
			noteFavoritesRepository: { exists: async () => false, insert: async values => { events.push(['insert', values]); } },
			idService: { gen: () => 'favorite1' },
			achievementService: { create: async (...args) => { events.push(['achievement', ...args]); } },
		});
		assert.equal(await nativeCall(operations, 'notesFavoritesCreate', { noteId: note.id }, actor), undefined);
		assert.deepEqual(events[0], ['insert', { id: 'favorite1', noteId: note.id, userId: 'alice' }]);
		if (note.userHost === null && note.userId !== actor.id) assert.deepEqual(events[1], ['achievement', 'bob', 'myNoteFavorited1']);
		else assert.equal(events.length, 1);
	});
});

test('gallery creation selects only the caller-owned files and rejects an entirely invalid selection', async () => {
	const lookups = [];
	const posts = [];
	const operations = createCollectionsRouter({
		driveFilesRepository: { findOneBy: async criteria => {
			lookups.push(criteria);
			return criteria.id === 'owned1' ? { id: 'owned1' } : null;
		} },
		galleryPostsRepository: { insertOne: async post => { posts.push(post); return post; } },
		galleryPostEntityService: { pack: async (post, principal) => { assert.equal(principal, actor); return galleryWire(post); } },
		idService: { gen: () => 'post1' },
	});
	await nativeCall(operations, 'galleryPostsCreate', { title: 'Art', fileIds: ['missing1', 'owned1'], isSensitive: false }, actor);
	assert.deepEqual(lookups, [{ id: 'missing1', userId: 'alice' }, { id: 'owned1', userId: 'alice' }]);
	assert.deepEqual(posts[0].fileIds, ['owned1']);
	assert.equal(posts[0].userId, actor.id);
	assert.ok(posts[0].updatedAt instanceof Date);
	await assert.rejects(nativeCall(operations, 'galleryPostsCreate', { title: 'Art', fileIds: ['missing2'], isSensitive: false }, actor));
	assert.equal(posts.length, 1);
});

test('gallery deletion denies unrelated non-moderators before deleting or logging', async () => {
	const operations = createCollectionsRouter({
		galleryPostsRepository: {
			findOneBy: async () => ({ id: 'post1', userId: 'bob' }),
			delete: async () => { assert.fail('Unauthorized post must not be deleted'); },
		},
		roleService: { isModerator: async () => false },
		moderationLogService: { log: async () => { assert.fail('Unauthorized deletion must not be logged as successful'); } },
	});
	await assert.rejects(nativeCall(operations, 'galleryPostsDelete', { postId: 'post1' }, actor), error =>
		error.code === 'ACCESS_DENIED' && error.data.id === 'c86e09de-1c48-43ac-a435-1c7e42ed4496');
});

test('native gallery contract rejects duplicate and excessive file selections before persistence', async () => {
	const operations = createCollectionsRouter({
		driveFilesRepository: { findOneBy: async () => { assert.fail('Invalid selection must not reach persistence'); } },
	});
	const client = createRouterClient(operations, { context: {
		credential: 'session', ip: '192.0.2.1', headers: {},
		services: { authenticate: async () => [actor, null], limitActor: () => actor.id, rateLimitFactor: async () => 1, limit: async () => null },
	} });
	for (const fileIds of [['same1', 'same1'], Array.from({ length: 33 }, (_, index) => `file${index}`)]) {
		await assert.rejects(client.galleryPostsCreate({ title: 'Art', fileIds }), error => error.code === 'BAD_REQUEST');
	}
});

test('collection commands retain legacy completion timing for secondary counters, logs, and achievements', async t => {
	for (const scenario of ['gallery like counter', 'gallery unlike counter', 'moderator deletion log', 'note favorite achievement']) {
		await t.test(scenario, async () => {
			let release;
			let sideEffectStarted = false;
			const secondary = new Promise(resolve => { release = resolve; });
			const sideEffect = () => { sideEffectStarted = true; return secondary; };
			const post = { id: 'post1', userId: 'bob' };
			let run;
			if (scenario === 'gallery like counter') {
				const operations = createCollectionsRouter({
					galleryPostsRepository: { findOneBy: async () => post, increment: sideEffect },
					galleryLikesRepository: { exists: async () => false, insert: async () => {} },
					idService: { gen: () => 'like1', parse: () => ({ date: new Date(0) }) },
				});
				run = () => nativeCall(operations, 'galleryPostsLike', { postId: 'post1' }, actor);
			} else if (scenario === 'gallery unlike counter') {
				const operations = createCollectionsRouter({
					galleryPostsRepository: { findOneBy: async () => post, decrement: sideEffect },
					galleryLikesRepository: { findOneBy: async () => ({ id: 'like1' }), delete: async () => {} },
					idService: { parse: () => ({ date: new Date(0) }) },
				});
				run = () => nativeCall(operations, 'galleryPostsUnlike', { postId: 'post1' }, actor);
			} else if (scenario === 'moderator deletion log') {
				const operations = createCollectionsRouter({
					galleryPostsRepository: { findOneBy: async () => post, delete: async () => {} },
					usersRepository: { findOneByOrFail: async () => ({ username: 'bob' }) },
					roleService: { isModerator: async () => true }, moderationLogService: { log: sideEffect },
				});
				run = () => nativeCall(operations, 'galleryPostsDelete', { postId: 'post1' }, actor);
			} else {
				const operations = createCollectionsRouter({
					getterService: { getNote: async () => ({ id: 'note1', userId: 'bob', userHost: null }) },
					noteEntityService: { isVisibleForMe: async () => true },
					noteFavoritesRepository: { exists: async () => false, insert: async () => {} },
					idService: { gen: () => 'favorite1' }, achievementService: { create: sideEffect },
				});
				run = () => nativeCall(operations, 'notesFavoritesCreate', { noteId: 'note1' }, actor);
			}
			try {
				const completion = run().then(() => 'complete');
				const outcome = await Promise.race([completion, new Promise(resolve => setImmediate(() => resolve('waiting')))]);
				assert.equal(sideEffectStarted, true);
				assert.equal(outcome, 'complete', 'Primary operation must finish while the secondary side effect remains pending');
			} finally {
				release();
			}
		});
	}
});

function nativeCall(router, key, input, principal = null) {
	return createRouterClient(router, { context: {
		credential: principal ? 'native' : null, ip: '127.0.0.1', headers: {},
		services: { authenticate: async () => [principal, null], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null },
		authorization: { rootUserId: () => principal?.id ?? null, roles: async () => [], policyAllowed: async () => true },
	} })[key](input);
}

function galleryWire(post) {
	return {
		id: post.id, createdAt: '2026-10-09T00:00:00.000Z', updatedAt: post.updatedAt.toISOString(),
		userId: post.userId, user: {
			id: post.userId, username: 'alice', name: null, host: null,
			avatarUrl: 'https://example.test/avatar', avatarBlurhash: null,
			avatarDecorations: [], emojis: {}, onlineStatus: 'unknown',
		},
		title: post.title, description: post.description ?? null, fileIds: post.fileIds, files: [],
		isSensitive: post.isSensitive, likedCount: 0,
	};
}
