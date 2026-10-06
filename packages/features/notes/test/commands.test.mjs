/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNotesCommands, legacyNotesCommandSchemas, notesCommandErrors } from '../../../backend/built/features/notes/backend.js';

const actor = { id: 'alice', host: null, isBot: false };
const note = { id: 'note1', userId: actor.id, threadId: null };
const draft = { id: 'draft1', userId: actor.id };
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
		isModerator: async user => { calls.push(['isModerator', user]); return false; },
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

function invoke(feature, key, input, currentActor = actor) {
	return feature[key](input, { context: currentActor == null ? undefined : { actor: currentActor } });
}

test('note command legacy schemas preserve required IDs and unbounded reaction strings', () => {
	const keys = [
		'notes/delete',
		'notes/drafts/delete',
		'notes/reactions/create',
		'notes/reactions/delete',
		'notes/thread-muting/create',
		'notes/thread-muting/delete',
		'notes/unrenote',
		'promo/read',
	];
	for (const key of keys) {
		const schema = legacyNotesCommandSchemas[key].input;
		const idField = key === 'notes/drafts/delete' ? 'draftId' : 'noteId';
		assert.equal(schema.type, 'object', key);
		assert.equal(schema.required.includes(idField), true, key);
		assert.equal(schema.properties[idField].format, 'misskey:id', key);
		assert.notEqual(schema.additionalProperties, false, key);
	}
	const reaction = legacyNotesCommandSchemas['notes/reactions/create'].input.properties.reaction;
	assert.deepEqual(reaction, { type: 'string' });
});

test('all eight command success paths call only their explicit ports and use the trusted actor', async () => {
	const { deps, calls } = createDeps({
		findRenotesByUserAndRenote: async (userId, renoteId) => {
			calls.push(['findRenotesByUserAndRenote', userId, renoteId]);
			return [{ id: 'renote1', userId: actor.id, threadId: null }];
		},
	});
	const feature = createNotesCommands(deps);
	const spoofed = { id: 'mallory' };

	await invoke(feature, 'notes/delete', { noteId: note.id, actor: spoofed });
	await invoke(feature, 'notes/drafts/delete', { draftId: draft.id, actor: spoofed });
	await invoke(feature, 'notes/reactions/create', { noteId: note.id, reaction: '🍰', actor: spoofed });
	await invoke(feature, 'notes/reactions/delete', { noteId: note.id });
	await invoke(feature, 'notes/thread-muting/create', { noteId: note.id });
	await invoke(feature, 'notes/thread-muting/delete', { noteId: note.id });
	await invoke(feature, 'notes/unrenote', { noteId: note.id });
	await invoke(feature, 'promo/read', { noteId: note.id });

	assert.deepEqual(calls.map(([name]) => name), [
		'getNote', 'isModerator', 'findUserByIdOrFail', 'deleteNote',
		'getDraft', 'deleteDraft',
		'getNote', 'createReaction',
		'getNote', 'deleteReaction',
		'getNote', 'threadMuteExists', 'newId', 'insertThreadMute',
		'getNote', 'deleteThreadMute',
		'getNote', 'findRenotesByUserAndRenote', 'findUserByIdOrFail', 'deleteNote',
		'getNote', 'promoReadExists', 'newId', 'insertPromoRead',
	]);
	assert.equal(calls[1][1], actor);
	assert.equal(calls[2][1], note.userId);
	assert.deepEqual(calls[3], ['deleteNote', { id: note.userId, uri: null, host: null, isBot: false }, note, false, actor]);
	assert.equal(calls[4][1], actor);
	assert.deepEqual(calls[5], ['deleteDraft', actor, draft.id]);
	assert.deepEqual(calls[7], ['createReaction', actor, note, '🍰']);
	assert.deepEqual(calls[11], ['threadMuteExists', note.id, actor.id]);
	assert.deepEqual(calls[13], ['insertThreadMute', 'generated1', note.id, actor.id]);
	assert.deepEqual(calls[15], ['deleteThreadMute', note.id, actor.id]);
	assert.deepEqual(calls[17], ['findRenotesByUserAndRenote', actor.id, note.id]);
	assert.deepEqual(calls[19], ['deleteNote', { id: actor.id, uri: null, host: null, isBot: false }, { id: 'renote1', userId: actor.id, threadId: null }]);
	assert.deepEqual(calls[21], ['promoReadExists', note.id, actor.id]);
	assert.deepEqual(calls[23], ['insertPromoRead', 'generated2', note.id, actor.id]);
});

test('note and draft lookups map their exact route errors before later side effects', async () => {
	for (const key of [
		'notes/delete', 'notes/reactions/create', 'notes/reactions/delete',
		'notes/thread-muting/create', 'notes/thread-muting/delete', 'notes/unrenote', 'promo/read',
	]) {
		const { deps, calls } = createDeps({ getNote: async id => { calls.push(['getNote', id]); throw serviceError(missingNoteId); } });
		const feature = createNotesCommands(deps);
		const input = key === 'notes/reactions/create'
			? { noteId: 'missing1', reaction: '⭐' }
			: { noteId: 'missing1' };
		await assert.rejects(invoke(feature, key, input), error => {
			assert.equal(error.definition.id, notesCommandErrors[key].noSuchNote.id);
			return true;
		});
		assert.deepEqual(calls, [['getNote', 'missing1']], key);
	}

	const { deps, calls } = createDeps({ getDraft: async (user, id) => { calls.push(['getDraft', user, id]); return null; } });
	const feature = createNotesCommands(deps);
	await assert.rejects(invoke(feature, 'notes/drafts/delete', { draftId: 'missing1' }), error => {
		assert.equal(error.definition.id, notesCommandErrors['notes/drafts/delete'].noSuchNoteDraft.id);
		return true;
	});
	assert.deepEqual(calls.map(([name]) => name), ['getDraft']);
});

test('missing or malformed authenticated actors fail before any dependency call', async () => {
	const { deps, calls } = createDeps();
	const feature = createNotesCommands(deps);
	const requests = [
		['notes/delete', { noteId: note.id }],
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
	await assert.rejects(invoke(feature, 'notes/delete', { noteId: note.id }, { id: '' }));
	assert.deepEqual(calls, []);
});

test('ownership failures and already-completed records do not perform follow-up writes', async () => {
	const otherNote = { ...note, userId: 'bob' };
	const noteCase = createDeps({ getNote: async id => { noteCase.calls.push(['getNote', id]); return otherNote; } });
	const noteFeature = createNotesCommands(noteCase.deps);
	await assert.rejects(invoke(noteFeature, 'notes/delete', { noteId: note.id }), error => {
		assert.equal(error.definition.id, notesCommandErrors['notes/delete'].accessDenied.id);
		return true;
	});
	assert.deepEqual(noteCase.calls.map(([name]) => name), ['getNote', 'isModerator']);

	const draftCase = createDeps({ getDraft: async (user, id) => { draftCase.calls.push(['getDraft', user, id]); return { ...draft, userId: 'bob' }; } });
	const draftFeature = createNotesCommands(draftCase.deps);
	await assert.rejects(invoke(draftFeature, 'notes/drafts/delete', { draftId: draft.id }), error => {
		assert.equal(error.definition.id, notesCommandErrors['notes/drafts/delete'].accessDenied.id);
		return true;
	});
	assert.deepEqual(draftCase.calls.map(([name]) => name), ['getDraft']);

	const threadCase = createDeps({ threadMuteExists: async (threadId, userId) => { threadCase.calls.push(['threadMuteExists', threadId, userId]); return true; } });
	const threadFeature = createNotesCommands(threadCase.deps);
	await assert.rejects(invoke(threadFeature, 'notes/thread-muting/create', { noteId: note.id }), error => {
		assert.equal(error.definition.id, notesCommandErrors['notes/thread-muting/create'].alreadyMuting.id);
		return true;
	});
	assert.deepEqual(threadCase.calls.map(([name]) => name), ['getNote', 'threadMuteExists']);

	const promoCase = createDeps({ promoReadExists: async (noteId, userId) => { promoCase.calls.push(['promoReadExists', noteId, userId]); return true; } });
	const promoFeature = createNotesCommands(promoCase.deps);
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
		const feature = createNotesCommands(deps);
		await assert.rejects(invoke(feature, 'notes/reactions/create', { noteId: note.id, reaction: '⭐' }), error => {
			assert.equal(error.definition.id, notesCommandErrors['notes/reactions/create'][errorName].id);
			return true;
		});
		assert.deepEqual(calls.map(([name]) => name), ['getNote', 'createReaction']);
	}

	const { deps, calls } = createDeps({ deleteReaction: async (...args) => { calls.push(['deleteReaction', ...args]); throw serviceError('60527ec9-b4cb-4a88-a6bd-32d3ad26817d'); } });
	const feature = createNotesCommands(deps);
	await assert.rejects(invoke(feature, 'notes/reactions/delete', { noteId: note.id }), error => {
		assert.equal(error.definition.id, notesCommandErrors['notes/reactions/delete'].notReacted.id);
		return true;
	});
	assert.deepEqual(calls.map(([name]) => name), ['getNote', 'deleteReaction']);
});

test('misskey IDs are validated, extra object fields remain ignored, and Unicode reaction text is not truncated', async () => {
	const { deps, calls } = createDeps();
	const feature = createNotesCommands(deps);
	await assert.rejects(invoke(feature, 'notes/delete', { noteId: 'invalid-id' }));
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
	const feature = createNotesCommands(deps);
	let settled = false;
	const pending = invoke(feature, 'notes/unrenote', { noteId: note.id }).then(() => { settled = true; });
	await pending;
	assert.equal(settled, true);
	assert.equal(typeof releaseDelete, 'function');
	assert.deepEqual(calls.map(([name]) => name), ['getNote', 'findRenotesByUserAndRenote', 'findUserByIdOrFail', 'deleteNote-start']);
	releaseDelete();
});
