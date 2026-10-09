/*
	* SPDX-FileCopyrightText: syuilo and misskey-project
	* SPDX-License-Identifier: AGPL-3.0-only
	*/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterClient } from '@orpc/server';
import {
	createCollectionsOperations,
	createCollectionsRouter,
	ClipService,
} from '../../../backend/built/features/collections/backend.js';

const routeMethods = { 'clips/delete': 'clipsDelete', 'clips/add-note': 'clipsAddNote', 'clips/remove-note': 'clipsRemoveNote' };
const collectionsErrors = {
	'clips/delete': { noSuchClip: { code: 'NO_SUCH_CLIP', message: 'No such clip.', id: '70ca08ba-6865-4630-b6fb-8494759aa754' } },
	'clips/add-note': {
		noSuchClip: { code: 'NO_SUCH_CLIP', message: 'No such clip.', id: 'd6e76cc0-a1b5-4c7c-a287-73fa9c716dcf' },
		noSuchNote: { code: 'NO_SUCH_NOTE', message: 'No such note.', id: 'fc8c0b49-c7a3-4664-a0a6-b418d386bb8b' },
		alreadyClipped: { code: 'ALREADY_CLIPPED', message: 'The note has already been clipped.', id: '734806c4-542c-463a-9311-15c512803965' },
		tooManyClipNotes: { code: 'TOO_MANY_CLIP_NOTES', message: 'You cannot add notes to the clip any more.', id: 'f0dba960-ff73-4615-8df4-d6ac5d9dc118' },
	},
	'clips/remove-note': {
		noSuchClip: { code: 'NO_SUCH_CLIP', message: 'No such clip.', id: 'b80525c6-97f7-49d7-a42d-ebccd49cfd52' },
		noSuchNote: { code: 'NO_SUCH_NOTE', message: 'No such note.', id: 'aff017de-190e-434b-893e-33a9ff5049d8' },
	},
};

function collectionOperations(deps) { return createCollectionsOperations({ clipService: deps }); }

const validInputs = {
	'clips/delete': { clipId: 'clip0123' },
	'clips/add-note': { clipId: 'clip0123', noteId: 'note0123' },
	'clips/remove-note': { clipId: 'clip0123', noteId: 'note0123' },
};

function createFeature(overrides = {}) {
	const calls = [];
	const deps = {
		delete: async (actor, clipId) => { calls.push(['delete', actor, clipId]); return 'ignored delete result'; },
		addNote: async (actor, clipId, noteId) => { calls.push(['addNote', actor, clipId, noteId]); return 'ignored add result'; },
		removeNote: async (actor, clipId, noteId) => { calls.push(['removeNote', actor, clipId, noteId]); return 'ignored remove result'; },
		...overrides,
	};
	return { feature: collectionOperations(deps), calls, deps };
}

function invoke(operations, route, input = validInputs[route], actor = { id: 'actor-1' }, options = {}) {
	const principal = options.missingContext || actor === null ? null : { isSuspended: false, movedToUri: null, ...actor };
	const client = createRouterClient(createCollectionsRouter(), { context: {
		credential: 'session', ip: '192.0.2.1', headers: {}, operations: { collections: operations },
		services: { authenticate: async () => [principal, null], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null },
	} });
	return client[routeMethods[route]](input);
}

test('each command validates Misskey IDs before calling dependencies', async () => {
	const { feature, calls } = createFeature();
	for (const [route, input] of Object.entries(validInputs)) {
		await invoke(feature, route, input);
		for (const field of Object.keys(input)) {
			for (const id of ['', 'bad:id', 'bad-id']) {
				await assert.rejects(invoke(feature, route, { ...input, [field]: id }));
			}
		}
	}
	assert.equal(calls.length, Object.keys(validInputs).length);
});

test('native commands require the authenticated actor; request fields cannot spoof identity', async () => {
	const { feature, calls } = createFeature();
	for (const route of Object.keys(validInputs)) {
		await assert.rejects(invoke(feature, route, { ...validInputs[route], actor: { id: 'request-spoof' } }, undefined, { missingContext: true }), error => error.code === 'CREDENTIAL_REQUIRED');
		for (const badActor of [null]) {
			await assert.rejects(invoke(feature, route, { ...validInputs[route], actor: { id: 'request-spoof' } }, badActor), error => error.code === 'CREDENTIAL_REQUIRED');
		}
		await invoke(feature, route, { ...validInputs[route], actor: { id: 'request-spoof' } }, { id: 'trusted-id', extra: 'trusted entity field' });
	}
	assert.deepEqual(calls.map(call => call[1]), Object.keys(validInputs).map(() => ({ id: 'trusted-id', isSuspended: false, movedToUri: null, extra: 'trusted entity field' })));
});

test('only actual domain errors mapped by each native route become its corresponding API error', async () => {
	const failures = {
		NOSUCHCLIP: ClipService.NoSuchClipError,
		NOSUCHNOTE: ClipService.NoSuchNoteError,
		ALREADYADDED: ClipService.AlreadyAddedError,
		TOOMANY: ClipService.TooManyClipNotesError,
	};
	const { feature, deps } = createFeature({
		delete: async () => { throw new ClipService.NoSuchClipError(); },
		addNote: async (_actor, _clipId, noteId) => { throw new failures[noteId](); },
		removeNote: async (_actor, _clipId, noteId) => { throw new failures[noteId](); },
	});

	for (const [route, input, key] of [
		['clips/delete', validInputs['clips/delete'], 'noSuchClip'],
		['clips/add-note', { ...validInputs['clips/add-note'], noteId: 'NOSUCHCLIP' }, 'noSuchClip'],
		['clips/add-note', { ...validInputs['clips/add-note'], noteId: 'NOSUCHNOTE' }, 'noSuchNote'],
		['clips/add-note', { ...validInputs['clips/add-note'], noteId: 'ALREADYADDED' }, 'alreadyClipped'],
		['clips/add-note', { ...validInputs['clips/add-note'], noteId: 'TOOMANY' }, 'tooManyClipNotes'],
		['clips/remove-note', { ...validInputs['clips/remove-note'], noteId: 'NOSUCHCLIP' }, 'noSuchClip'],
		['clips/remove-note', { ...validInputs['clips/remove-note'], noteId: 'NOSUCHNOTE' }, 'noSuchNote'],
	]) {
		const expected = collectionsErrors[route][key];
		await assert.rejects(invoke(feature, route, input), error => error.code === expected.code && error.data.id === expected.id && error.message === expected.message);
	}

	const unavailableForRoute = new ClipService.NoSuchNoteError('clip route cannot map note errors');
	deps.delete = async () => { throw unavailableForRoute; };
	const deleteOnlyNoClipFeature = collectionOperations(deps);
	await assert.rejects(invoke(deleteOnlyNoClipFeature, 'clips/delete'), error => error === unavailableForRoute);
});

test('unclassified service failures propagate by identity on every route', async () => {
	const failure = new Error('database down');
	for (const method of ['delete', 'addNote', 'removeNote']) {
		const deps = createFeature().deps;
		deps[method] = async () => { throw failure; };
		await assert.rejects(invoke(collectionOperations(deps), `clips/${method === 'delete' ? 'delete' : method === 'addNote' ? 'add-note' : 'remove-note'}`), error => error === failure);
	}
});

test('all commands await their service operation and return only void', async () => {
	for (const [route, method] of [
		['clips/delete', 'delete'],
		['clips/add-note', 'addNote'],
		['clips/remove-note', 'removeNote'],
	]) {
		const events = [];
		let finish;
		let started;
		const serviceStarted = new Promise(resolve => { started = resolve; });
		const deps = createFeature().deps;
		deps[method] = async (...args) => {
			events.push(['start', ...args]);
			started();
			await new Promise(resolve => { finish = resolve; });
			events.push(['finish']);
			return 'service response is intentionally discarded';
		};
		const feature = collectionOperations(deps);
		let settled = false;
		const result = invoke(feature, route).then(value => { settled = true; return value; });
		await serviceStarted;
		assert.equal(settled, false);
		finish();
		assert.equal(await result, undefined);
		assert.equal(settled, true);
		assert.equal(events.at(-1)[0], 'finish');
	}
});
