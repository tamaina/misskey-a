/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	clipFavoriteErrors,
	createClipFavoriteCommands,
	legacyClipFavoriteSchemas,
} from '../../../backend/built/features/collections/backend.js';

const input = { clipId: 'clip0123' };
const defaultClip = { id: input.clipId, userId: 'owner-1', isPublic: true };

function createFeature(overrides = {}) {
	const calls = [];
	const deps = {
		findClipById: async id => {
			calls.push(['findClipById', id]);
			return overrides.findClipById ? overrides.findClipById(id) : defaultClip;
		},
		hasFavorite: async (clipId, userId) => {
			calls.push(['hasFavorite', clipId, userId]);
			return overrides.hasFavorite ? overrides.hasFavorite(clipId, userId) : false;
		},
		generateFavoriteId: () => {
			calls.push(['generateFavoriteId']);
			return overrides.generateFavoriteId ? overrides.generateFavoriteId() : 'favorite-id';
		},
		insertFavorite: async values => {
			calls.push(['insertFavorite', values]);
			if (overrides.insertFavorite) return overrides.insertFavorite(values);
		},
		findFavorite: async (clipId, userId) => {
			calls.push(['findFavorite', clipId, userId]);
			return overrides.findFavorite ? overrides.findFavorite(clipId, userId) : { id: 'favorite-id' };
		},
		deleteFavorite: async id => {
			calls.push(['deleteFavorite', id]);
			if (overrides.deleteFavorite) return overrides.deleteFavorite(id);
		},
		createError: definition => {
			if (overrides.createError) return overrides.createError(definition);
			const error = new Error(definition.message);
			Object.assign(error, definition);
			return error;
		},
	};
	return { feature: createClipFavoriteCommands(deps), calls, deps };
}

function invoke(feature, route, params = input, actor = { id: 'owner-1' }, options = {}) {
	return feature[route](params, { context: options.missingContext ? undefined : { actor } });
}

test('favorite legacy schemas retain the clip ID shape and loose request object', () => {
	const schema = {
		type: 'object',
		properties: { clipId: { type: 'string', format: 'misskey:id' } },
		required: ['clipId'],
	};
	assert.deepEqual(legacyClipFavoriteSchemas['clips/favorite'].input, schema);
	assert.deepEqual(legacyClipFavoriteSchemas['clips/unfavorite'].input, schema);
});

test('favorite conceals missing and another user’s private clips with the legacy error', async () => {
	for (const clip of [null, { id: input.clipId, userId: 'other-user', isPublic: false }]) {
		const { feature, calls } = createFeature({ findClipById: async () => clip });
		await assert.rejects(invoke(feature, 'clips/favorite'), error => error.code === 'NO_SUCH_CLIP'
			&& error.id === clipFavoriteErrors['clips/favorite'].noSuchClip.id
			&& error.message === 'No such clip.');
		assert.deepEqual(calls, [['findClipById', input.clipId]]);
	}
});

test('favorite allows its owner to favorite a private clip and a stranger to favorite a public clip', async () => {
	const privateOwner = createFeature({
		findClipById: async id => ({ id, userId: 'owner-1', isPublic: false }),
	});
	await invoke(privateOwner.feature, 'clips/favorite');
	assert.deepEqual(privateOwner.calls.map(call => call[0]), ['findClipById', 'hasFavorite', 'generateFavoriteId', 'insertFavorite']);

	const publicClip = createFeature({
		findClipById: async id => ({ id, userId: 'another-owner', isPublic: true }),
	});
	await invoke(publicClip.feature, 'clips/favorite', input, { id: 'stranger-1' });
	assert.deepEqual(publicClip.calls.at(-1), ['insertFavorite', { id: 'favorite-id', clipId: input.clipId, userId: 'stranger-1' }]);
});

test('duplicate favorites fail before generating an ID or inserting', async () => {
	const { feature, calls } = createFeature({ hasFavorite: async () => true });
	await assert.rejects(invoke(feature, 'clips/favorite'), error => error.code === 'ALREADY_FAVORITED'
		&& error.id === clipFavoriteErrors['clips/favorite'].alreadyFavorited.id
		&& error.message === 'The clip has already been favorited.');
	assert.deepEqual(calls.map(call => call[0]), ['findClipById', 'hasFavorite']);
});

test('unfavorite permits deleting an existing favorite after the clip becomes private', async () => {
	const { feature, calls } = createFeature({
		findClipById: async id => ({ id, userId: 'someone-else', isPublic: false }),
		findFavorite: async () => ({ id: 'existing-favorite' }),
	});
	await invoke(feature, 'clips/unfavorite', input, { id: 'former-public-viewer' });
	assert.deepEqual(calls, [
		['findClipById', input.clipId],
		['findFavorite', input.clipId, 'former-public-viewer'],
		['deleteFavorite', 'existing-favorite'],
	]);
});

test('unfavorite distinguishes missing clips from missing owned favorites', async () => {
	const missingClip = createFeature();
	missingClip.deps.findClipById = async id => { missingClip.calls.push(['findClipById', id]); return null; };
	missingClip.feature = createClipFavoriteCommands(missingClip.deps);
	await assert.rejects(invoke(missingClip.feature, 'clips/unfavorite'), error => error.code === 'NO_SUCH_CLIP'
		&& error.id === clipFavoriteErrors['clips/unfavorite'].noSuchClip.id);
	assert.deepEqual(missingClip.calls.map(call => call[0]), ['findClipById']);

	const notFavorited = createFeature();
	notFavorited.deps.findFavorite = async (clipId, userId) => { notFavorited.calls.push(['findFavorite', clipId, userId]); return null; };
	notFavorited.feature = createClipFavoriteCommands(notFavorited.deps);
	await assert.rejects(invoke(notFavorited.feature, 'clips/unfavorite'), error => error.code === 'NOT_FAVORITED'
		&& error.id === clipFavoriteErrors['clips/unfavorite'].notFavorited.id
		&& error.message === 'You have not favorited the clip.');
	assert.deepEqual(notFavorited.calls.map(call => call[0]), ['findClipById', 'findFavorite']);
});

test('commands validate Misskey IDs, accept loose extra fields, and require a trusted actor', async () => {
	const { feature, calls } = createFeature();
	await assert.rejects(invoke(feature, 'clips/favorite', { clipId: 'bad:id' }));
	assert.equal(calls.length, 0);
	await assert.rejects(invoke(feature, 'clips/favorite', input, undefined, { missingContext: true }), /authenticated actor/i);
	await invoke(feature, 'clips/favorite', { ...input, ignored: true });
	assert.equal(calls.at(-1)[0], 'insertFavorite');
});

test('favorite generation and persistence are ordered and awaited; command output stays void', async () => {
	let finishInsert;
	let insertStarted;
	const started = new Promise(resolve => { insertStarted = resolve; });
	const { feature, calls } = createFeature({
		insertFavorite: async () => {
			insertStarted();
			await new Promise(resolve => { finishInsert = resolve; });
			calls.push(['inserted']);
			return { ignored: true };
		},
	});
	let settled = false;
	const result = invoke(feature, 'clips/favorite').then(value => { settled = true; return value; });
	await started;
	assert.equal(settled, false);
	assert.deepEqual(calls.map(call => call[0]), ['findClipById', 'hasFavorite', 'generateFavoriteId', 'insertFavorite']);
	finishInsert();
	assert.equal(await result, undefined);
	assert.equal(settled, true);
	assert.equal(calls.at(-1)[0], 'inserted');
});

test('unfavorite waits for favorite deletion and ignores its result', async () => {
	let finishDelete;
	let deleteStarted;
	const started = new Promise(resolve => { deleteStarted = resolve; });
	const { feature, calls } = createFeature({
		deleteFavorite: async id => {
			calls.push(['deleteFavorite', id]);
			deleteStarted();
			await new Promise(resolve => { finishDelete = resolve; });
			return { ignored: true };
		},
	});
	let settled = false;
	const result = invoke(feature, 'clips/unfavorite').then(value => { settled = true; return value; });
	await started;
	assert.equal(settled, false);
	finishDelete();
	assert.equal(await result, undefined);
	assert.equal(settled, true);
});
