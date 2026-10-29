/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as v from 'valibot';
import { createProcedureClient } from '@orpc/server';
import { notesApiContract, createNotesRouter } from '../../../backend/built/features/notes/backend.js';

const actor = { id: 'alice', host: null, isBot: false, isSuspended: false, movedToUri: null };
const note = { id: 'note1', userId: actor.id, threadId: null };
const draft = { id: 'draft1', userId: actor.id };
const expectedErrors = {
	'notes/delete': {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '490be23f-8c1f-4796-819f-94cb4f9d1630',
		},
		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: 'fe8d7103-0ea8-4ec3-814d-f8b401dc69e9',
		},
	},
	'notes/drafts/delete': {
		noSuchNoteDraft: {
			message: 'No such note draft.',
			code: 'NO_SUCH_NOTE_DRAFT',
			id: '49cd6b9d-848e-41ee-b0b9-adaca711a6b1',
		},
		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '56f35758-7dd5-468b-8439-5d6fb8ec9b8e',
		},
	},
	'notes/reactions/create': {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '033d0620-5bfe-4027-965d-980b0c85a3ea',
		},
		alreadyReacted: {
			message: 'You are already reacting to that note.',
			code: 'ALREADY_REACTED',
			id: '71efcf98-86d6-4e2b-b2ad-9d032369366b',
		},
		youHaveBeenBlocked: {
			message: 'You cannot react this note because you have been blocked by this user.',
			code: 'YOU_HAVE_BEEN_BLOCKED',
			id: '20ef5475-9f38-4e4c-bd33-de6d979498ec',
		},
		cannotReactToRenote: {
			message: 'You cannot react to Renote.',
			code: 'CANNOT_REACT_TO_RENOTE',
			id: 'eaccdc08-ddef-43fe-908f-d108faad57f5',
		},
	},
	'notes/reactions/delete': {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '764d9fce-f9f2-4a0e-92b1-6ceac9a7ad37',
		},
		notReacted: {
			message: 'You are not reacting to that note.',
			code: 'NOT_REACTED',
			id: '92f4426d-4196-4125-aa5b-02943e2ec8fc',
		},
	},
	'notes/thread-muting/create': {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '5ff67ada-ed3b-2e71-8e87-a1a421e177d2',
		},
		alreadyMuting: {
			message: 'You are already muting that thread.',
			code: 'ALREADY_MUTING',
			id: 'c146e22d-1141-4b31-b28d-176371014d18',
		},
	},
	'notes/thread-muting/delete': {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'bddd57ac-ceb3-b29d-4334-86ea5fae481a',
		},
	},
	'notes/unrenote': {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'efd4a259-2442-496b-8dd7-b255aa1a160f',
		},
	},
	'promo/read': {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'd785b897-fcd3-4fe9-8fc3-b85c26e6c932',
		},
	},
};

const missingNoteId = '9725d0ce-ba28-4dde-95a7-2cbb2c15de24';

function createError(definition) {
	const error = new Error(definition.code);
	error.definition = definition;
	return error;
}

function serviceError(id) {
	return Object.assign(new Error(id), { id });
}

function createDeps(overrides = {}) {
	const calls = [];
	let nextId = 0;
	const deps = {
		getNote: async id => { calls.push(['getNote', id]); return note; },
		findUserByIdOrFail: async id => { calls.push(['findUserByIdOrFail', id]); return { id, uri: null, host: null, isBot: false }; },
		deleteNote: async (...args) => { calls.push(['deleteNote', ...args]); },
		getDraft: async (user, id) => { calls.push(['getDraft', user, id]); return draft; },
		deleteDraft: async (user, id) => { calls.push(['deleteDraft', user, id]); },
		createReaction: async (...args) => { calls.push(['createReaction', ...args]); },
		deleteReaction: async (...args) => { calls.push(['deleteReaction', ...args]); },
		threadMuteExists: async (threadId, userId) => { calls.push(['threadMuteExists', threadId, userId]); return false; },
		insertThreadMute: async (...args) => { calls.push(['insertThreadMute', ...args]); },
		deleteThreadMute: async (...args) => { calls.push(['deleteThreadMute', ...args]); },
		findRenotesByUserAndRenote: async (userId, renoteId) => { calls.push(['findRenotesByUserAndRenote', userId, renoteId]); return []; },
		promoReadExists: async (noteId, userId) => { calls.push(['promoReadExists', noteId, userId]); return false; },
		insertPromoRead: async (...args) => { calls.push(['insertPromoRead', ...args]); },
		newId: () => { const id = `generated${++nextId}`; calls.push(['newId', id]); return id; },
		createError,
		...overrides,
	};
	return { deps, calls };
}

function methodName(key) {
	return key.split(/[/-]/).map((part, index) => index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)).join('');
}

async function invoke(dependencies, key, input, currentActor = actor) {
	const procedure = createNotesRouter(dependencies)[methodName(key)];
	const services = {
		authenticate: async () => [currentActor, null],
		limitActor: () => null,
		rateLimitFactor: async () => 1,
		limit: async () => null,
	};
	return createProcedureClient(procedure, { context: {
		services, credential: currentActor ? 'fixture' : null, ip: '127.0.0.1', headers: {},
	} })(input);
}

test('native command contracts enforce required IDs and allow unbounded Unicode reaction strings', () => {
	for (const key of ['notes/drafts/delete', 'notes/reactions/create', 'notes/reactions/delete', 'notes/thread-muting/create', 'notes/thread-muting/delete', 'notes/unrenote', 'promo/read']) {
		const schema = notesApiContract[methodName(key)]['~orpc'].inputSchema;
		const fields = key === 'notes/drafts/delete' ? { draftId: draft.id } : { noteId: note.id, reaction: '🧁'.repeat(512) };
		assert.equal(v.safeParse(schema, fields).success, true, key);
		assert.equal(v.safeParse(schema, {}).success, false, key);
		assert.equal(v.safeParse(schema, []).success, false, key);
	}
});

test('all seven native command success paths call only their explicit ports and use the trusted actor', async () => {
	const { deps, calls } = createDeps({
		findRenotesByUserAndRenote: async (userId, renoteId) => {
			calls.push(['findRenotesByUserAndRenote', userId, renoteId]);
			return [{ id: 'renote1', userId: actor.id, threadId: null }];
		},
	});
	const feature = deps;
	const spoofed = { id: 'mallory' };

	await invoke(feature, 'notes/drafts/delete', { draftId: draft.id, actor: spoofed });
	await invoke(feature, 'notes/reactions/create', { noteId: note.id, reaction: '🍰', actor: spoofed });
	await invoke(feature, 'notes/reactions/delete', { noteId: note.id });
	await invoke(feature, 'notes/thread-muting/create', { noteId: note.id });
	await invoke(feature, 'notes/thread-muting/delete', { noteId: note.id });
	await invoke(feature, 'notes/unrenote', { noteId: note.id });
	await invoke(feature, 'promo/read', { noteId: note.id });

	assert.deepEqual(calls.map(([name]) => name), [
		'getDraft', 'deleteDraft',
		'getNote', 'createReaction',
		'getNote', 'deleteReaction',
		'getNote', 'threadMuteExists', 'newId', 'insertThreadMute',
		'getNote', 'deleteThreadMute',
		'getNote', 'findRenotesByUserAndRenote', 'findUserByIdOrFail', 'deleteNote',
		'getNote', 'promoReadExists', 'newId', 'insertPromoRead',
	]);
	assert.equal(calls[0][1], actor);
	assert.deepEqual(calls[1], ['deleteDraft', actor, draft.id]);
	assert.deepEqual(calls[3], ['createReaction', actor, note, '🍰']);
	assert.deepEqual(calls[7], ['threadMuteExists', note.id, actor.id]);
	assert.deepEqual(calls[9], ['insertThreadMute', 'generated1', note.id, actor.id]);
	assert.deepEqual(calls[11], ['deleteThreadMute', note.id, actor.id]);
	assert.deepEqual(calls[13], ['findRenotesByUserAndRenote', actor.id, note.id]);
	assert.deepEqual(calls[15], ['deleteNote', { id: actor.id, uri: null, host: null, isBot: false }, { id: 'renote1', userId: actor.id, threadId: null }]);
	assert.deepEqual(calls[17], ['promoReadExists', note.id, actor.id]);
	assert.deepEqual(calls[19], ['insertPromoRead', 'generated2', note.id, actor.id]);
});

test('note and draft lookups map their exact route errors before later side effects', async () => {
	for (const key of [
		'notes/reactions/create', 'notes/reactions/delete',
		'notes/thread-muting/create', 'notes/thread-muting/delete', 'notes/unrenote', 'promo/read',
	]) {
		const { deps, calls } = createDeps({ getNote: async id => { calls.push(['getNote', id]); throw serviceError(missingNoteId); } });
		const feature = deps;
		const input = key === 'notes/reactions/create'
			? { noteId: 'missing1', reaction: '⭐' }
			: { noteId: 'missing1' };
		await assert.rejects(invoke(feature, key, input), error => {
			assert.equal(error.definition.id, expectedErrors[key].noSuchNote.id);
			return true;
		});
		assert.deepEqual(calls, [['getNote', 'missing1']], key);
	}

	const { deps, calls } = createDeps({ getDraft: async (user, id) => { calls.push(['getDraft', user, id]); return null; } });
	const feature = deps;
	await assert.rejects(invoke(feature, 'notes/drafts/delete', { draftId: 'missing1' }), error => {
		assert.equal(error.definition.id, expectedErrors['notes/drafts/delete'].noSuchNoteDraft.id);
		return true;
	});
	assert.deepEqual(calls.map(([name]) => name), ['getDraft']);
});

test('missing or suspended authenticated actors fail before any dependency call', async () => {
	const { deps, calls } = createDeps();
	const feature = deps;
	const requests = [
		['notes/drafts/delete', { draftId: draft.id }],
		['notes/reactions/create', { noteId: note.id, reaction: '⭐' }],
		['notes/reactions/delete', { noteId: note.id }],
		['notes/thread-muting/create', { noteId: note.id }],
		['notes/thread-muting/delete', { noteId: note.id }],
		['notes/unrenote', { noteId: note.id }],
		['promo/read', { noteId: note.id }],
	];
	for (const [key, input] of requests) {
		await assert.rejects(invoke(feature, key, input, null));
	}
	await assert.rejects(invoke(feature, 'notes/reactions/delete', { noteId: note.id }, { ...actor, isSuspended: true }));
	assert.deepEqual(calls, []);
});

test('ownership failures and already-completed records do not perform follow-up writes', async () => {
	const draftCase = createDeps({ getDraft: async (user, id) => { draftCase.calls.push(['getDraft', user, id]); return { ...draft, userId: 'bob' }; } });
	const draftFeature = draftCase.deps;
	await assert.rejects(invoke(draftFeature, 'notes/drafts/delete', { draftId: draft.id }), error => {
		assert.equal(error.definition.id, expectedErrors['notes/drafts/delete'].accessDenied.id);
		return true;
	});
	assert.deepEqual(draftCase.calls.map(([name]) => name), ['getDraft']);

	const threadCase = createDeps({ threadMuteExists: async (threadId, userId) => { threadCase.calls.push(['threadMuteExists', threadId, userId]); return true; } });
	const threadFeature = threadCase.deps;
	await assert.rejects(invoke(threadFeature, 'notes/thread-muting/create', { noteId: note.id }), error => {
		assert.equal(error.definition.id, expectedErrors['notes/thread-muting/create'].alreadyMuting.id);
		return true;
	});
	assert.deepEqual(threadCase.calls.map(([name]) => name), ['getNote', 'threadMuteExists']);

	const promoCase = createDeps({ promoReadExists: async (noteId, userId) => { promoCase.calls.push(['promoReadExists', noteId, userId]); return true; } });
	const promoFeature = promoCase.deps;
	await invoke(promoFeature, 'promo/read', { noteId: note.id });
	assert.deepEqual(promoCase.calls.map(([name]) => name), ['getNote', 'promoReadExists']);
});

test('reaction failures preserve their route-specific errors and skip any later work', async () => {
	const createMappings = [
		['51c42bb4-931a-456b-bff7-e5a8a70dd298', 'alreadyReacted'],
		['e70412a4-7197-4726-8e74-f3e0deb92aa7', 'youHaveBeenBlocked'],
		['12c35529-3c79-4327-b1cc-e2cf63a71925', 'cannotReactToRenote'],
	];
	for (const [serviceId, errorName] of createMappings) {
		const { deps, calls } = createDeps({ createReaction: async (...args) => { calls.push(['createReaction', ...args]); throw serviceError(serviceId); } });
		const feature = deps;
		await assert.rejects(invoke(feature, 'notes/reactions/create', { noteId: note.id, reaction: '⭐' }), error => {
			assert.equal(error.definition.id, expectedErrors['notes/reactions/create'][errorName].id);
			return true;
		});
		assert.deepEqual(calls.map(([name]) => name), ['getNote', 'createReaction']);
	}

	const { deps, calls } = createDeps({ deleteReaction: async (...args) => { calls.push(['deleteReaction', ...args]); throw serviceError('60527ec9-b4cb-4a88-a6bd-32d3ad26817d'); } });
	const feature = deps;
	await assert.rejects(invoke(feature, 'notes/reactions/delete', { noteId: note.id }), error => {
		assert.equal(error.definition.id, expectedErrors['notes/reactions/delete'].notReacted.id);
		return true;
	});
	assert.deepEqual(calls.map(([name]) => name), ['getNote', 'deleteReaction']);
});

test('misskey IDs are validated, extra object fields remain ignored, and Unicode reaction text is not truncated', async () => {
	const { deps, calls } = createDeps();
	const feature = deps;
	await assert.rejects(invoke(feature, 'notes/reactions/delete', { noteId: 'invalid-id' }));
	await assert.rejects(invoke(feature, 'notes/reactions/create', { noteId: note.id, reaction: 123 }));
	assert.deepEqual(calls, []);

	const reaction = '🧁'.repeat(512);
	await invoke(feature, 'notes/reactions/create', { noteId: note.id, reaction, actor: { id: 'mallory' } });
	assert.deepEqual(calls[1], ['createReaction', actor, note, reaction]);
});

test('unrenote preserves the legacy fire-and-forget delete timing', async () => {
	let releaseDelete;
	const { deps, calls } = createDeps({
		findRenotesByUserAndRenote: async (userId, renoteId) => {
			calls.push(['findRenotesByUserAndRenote', userId, renoteId]);
			return [{ id: 'renote1', userId: actor.id, threadId: null }];
		},
		deleteNote: (...args) => {
			calls.push(['deleteNote-start', ...args]);
			return new Promise(resolve => { releaseDelete = resolve; });
		},
	});
	const feature = deps;
	let settled = false;
	const pending = invoke(feature, 'notes/unrenote', { noteId: note.id }).then(() => { settled = true; });
	await pending;
	assert.equal(settled, true);
	assert.equal(typeof releaseDelete, 'function');
	assert.deepEqual(calls.map(([name]) => name), ['getNote', 'findRenotesByUserAndRenote', 'findUserByIdOrFail', 'deleteNote-start']);
	releaseDelete();
});
