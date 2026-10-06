/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	collectionsErrors,
	createCollectionCommands,
	legacyCollectionsSchemas,
} from '../../../backend/built/features/collections/backend.js';

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
		classifyError: () => undefined,
		createError: definition => {
			const error = new Error(definition.message);
			Object.assign(error, definition);
			return error;
		},
		...overrides,
	};
	return { feature: createCollectionCommands(deps), calls, deps };
}

function invoke(feature, route, input = validInputs[route], actor = { id: 'actor-1' }, options = {}) {
	return feature[route](input, { context: options.missingContext ? undefined : { actor } });
}

test('legacy schemas preserve required Misskey ID fields for each route', () => {
	const schema = (properties, required) => ({
		type: 'object',
		properties: Object.fromEntries(properties.map(name => [name, { type: 'string', format: 'misskey:id' }])),
		required,
	});
	assert.deepEqual(legacyCollectionsSchemas['clips/delete'].input, schema(['clipId'], ['clipId']));
	assert.deepEqual(legacyCollectionsSchemas['clips/add-note'].input, schema(['clipId', 'noteId'], ['clipId', 'noteId']));
	assert.deepEqual(legacyCollectionsSchemas['clips/remove-note'].input, schema(['clipId', 'noteId'], ['clipId', 'noteId']));
});

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

test('commands require and project the trusted actor; request fields cannot spoof identity', async () => {
	const { feature, calls } = createFeature();
	for (const route of Object.keys(validInputs)) {
		await assert.rejects(invoke(feature, route, { ...validInputs[route], actor: { id: 'request-spoof' } }, undefined, { missingContext: true }), /authenticated actor/i);
		for (const badActor of [null, {}, { id: '' }]) {
			await assert.rejects(invoke(feature, route, { ...validInputs[route], actor: { id: 'request-spoof' } }, badActor), /authenticated actor/i);
		}
		await invoke(feature, route, { ...validInputs[route], actor: { id: 'request-spoof' } }, { id: 'trusted-id', extra: 'not forwarded' });
	}
	assert.deepEqual(calls.map(call => call[1]), Object.keys(validInputs).map(() => ({ id: 'trusted-id' })));
});

test('only errors mapped by each legacy route become its corresponding API error', async () => {
	const classifications = new Map([
		['NOSUCHCLIP', 'noSuchClip'],
		['NOSUCHNOTE', 'noSuchNote'],
		['ALREADYADDED', 'alreadyAdded'],
		['TOOMANY', 'tooManyClipNotes'],
	]);
	const { feature, deps } = createFeature({
		classifyError: error => classifications.get(error?.code),
		delete: async () => { throw Object.assign(new Error('missing clip'), { code: 'NOSUCHCLIP' }); },
		addNote: async (_actor, _clipId, noteId) => { throw Object.assign(new Error('classified'), { code: noteId }); },
		removeNote: async (_actor, _clipId, noteId) => { throw Object.assign(new Error('classified'), { code: noteId }); },
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
		await assert.rejects(invoke(feature, route, input), error => error.code === expected.code && error.id === expected.id && error.message === expected.message);
	}

	const unavailableForRoute = Object.assign(new Error('clip route cannot map note errors'), { code: 'NOSUCHNOTE' });
	deps.delete = async () => { throw unavailableForRoute; };
	const deleteOnlyNoClipFeature = createCollectionCommands(deps);
	await assert.rejects(invoke(deleteOnlyNoClipFeature, 'clips/delete'), error => error === unavailableForRoute);
});

test('unclassified service failures propagate by identity on every route', async () => {
	const failure = new Error('database down');
	for (const method of ['delete', 'addNote', 'removeNote']) {
		const deps = createFeature().deps;
		deps[method] = async () => { throw failure; };
		await assert.rejects(invoke(createCollectionCommands(deps), `clips/${method === 'delete' ? 'delete' : method === 'addNote' ? 'add-note' : 'remove-note'}`), error => error === failure);
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
		const feature = createCollectionCommands(deps);
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
