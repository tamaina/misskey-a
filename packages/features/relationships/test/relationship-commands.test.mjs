/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRelationshipCommands, legacyRelationshipSchemas } from '../../../backend/built/features/relationships/backend.js';

const actor = { id: 'actor123', profile: { retained: true } };
const user = { id: 'user123', profile: { retained: true } };
const muting = { id: 'muting123' };
const renoteMuting = { id: 'renote-muting123' };

function makeError(definition) {
	const error = new Error(definition.message);
	error.definition = definition;
	error.code = definition.code;
	error.id = definition.id;
	return error;
}

function createFixture(overrides = {}) {
	const calls = [];
	const deps = {
		getUser: async (...args) => { calls.push(['getUser', ...args]); return user; },
		isMissingUserError: error => error?.id === '15348ddd-432d-49c2-8a5a-8069753becff',
		acceptFollowRequest: async (...args) => { calls.push(['acceptFollowRequest', ...args]); },
		rejectFollowRequest: async (...args) => { calls.push(['rejectFollowRequest', ...args]); },
		isMissingFollowRequestError: error => error?.id === '8884c2dd-5795-4ac9-b27e-6a01d38190f9',
		findMuting: async (...args) => { calls.push(['findMuting', ...args]); return muting; },
		unmute: async (...args) => { calls.push(['unmute', ...args]); },
		isRenoteMuting: async (...args) => { calls.push(['isRenoteMuting', ...args]); return false; },
		muteRenotes: async (...args) => { calls.push(['muteRenotes', ...args]); },
		findRenoteMuting: async (...args) => { calls.push(['findRenoteMuting', ...args]); return renoteMuting; },
		unmuteRenotes: async (...args) => { calls.push(['unmuteRenotes', ...args]); },
		createError: makeError,
		...overrides,
	};
	return { feature: createRelationshipCommands(deps), calls };
}

function invoke(feature, route, input = { userId: user.id }, trustedActor = actor) {
	return feature[route](input, { context: trustedActor === undefined ? undefined : { actor: trustedActor } });
}

test('legacy relationship input schemas use misskey IDs and accept extra request fields', () => {
	const id = { type: 'string', format: 'misskey:id' };
	for (const route of [
		'following/requests/accept',
		'following/requests/reject',
		'mute/delete',
		'renote-mute/create',
		'renote-mute/delete',
	]) {
		assert.deepEqual(legacyRelationshipSchemas[route].input, {
			type: 'object', properties: { userId: id }, required: ['userId'],
		});
	}
});

test('relationship contract validates IDs before invoking dependency ports', async () => {
	const { feature, calls } = createFixture();
	await assert.rejects(invoke(feature, 'mute/delete', { userId: 'bad/id' }));
	assert.deepEqual(calls, []);
});

test('selected commands keep legacy call order, trusted actor, awaited services and void results', async () => {
	const { feature, calls } = createFixture();
	for (const route of [
		'following/requests/accept',
		'following/requests/reject',
		'mute/delete',
		'renote-mute/create',
		'renote-mute/delete',
	]) {
		assert.equal(await invoke(feature, route, { userId: user.id, extra: true, actor: { id: 'spoofed' } }), undefined);
	}
	assert.deepEqual(calls, [
		['getUser', user.id], ['acceptFollowRequest', actor, user],
		['getUser', user.id], ['rejectFollowRequest', actor, user],
		['getUser', user.id], ['findMuting', actor.id, user.id], ['unmute', [muting]],
		['getUser', user.id], ['isRenoteMuting', actor.id, user.id], ['muteRenotes', actor, user],
		['getUser', user.id], ['findRenoteMuting', actor.id, user.id], ['unmuteRenotes', [renoteMuting]],
	]);
});

test('self-mute is rejected before lookup and missing user/follow-request errors keep endpoint IDs', async () => {
	const { feature, calls } = createFixture({ getUser: async () => { throw Object.assign(new Error('missing'), { id: '15348ddd-432d-49c2-8a5a-8069753becff' }); } });
	await assert.rejects(invoke(feature, 'mute/delete', { userId: actor.id }), error => error.code === 'MUTEE_IS_YOURSELF');
	await assert.rejects(invoke(feature, 'following/requests/accept'), error => error.id === '66ce1645-d66c-46bb-8b79-96739af885bd');
	assert.deepEqual(calls, []);

	const missingRequest = createFixture({
		acceptFollowRequest: async () => { throw Object.assign(new Error('missing request'), { id: '8884c2dd-5795-4ac9-b27e-6a01d38190f9' }); },
	});
	await assert.rejects(invoke(missingRequest.feature, 'following/requests/accept'), error => error.id === 'bcde4f8b-0913-4614-8881-614e522fb041');
});

test('unmute commands treat null and undefined as missing without invoking the service', async () => {
	for (const [route, field, code] of [
		['mute/delete', 'findMuting', '5467d020-daa9-4553-81e1-135c0c35a96d'],
		['renote-mute/delete', 'findRenoteMuting', '2e4ef874-8bf0-4b4b-b069-4598f6d05817'],
	]) {
		for (const missing of [null, undefined]) {
			let called = false;
			const { feature } = createFixture({ [field]: async () => missing, unmute: async () => { called = true; }, unmuteRenotes: async () => { called = true; } });
			await assert.rejects(invoke(feature, route), error => error.id === code);
			assert.equal(called, false);
		}
	}
});
