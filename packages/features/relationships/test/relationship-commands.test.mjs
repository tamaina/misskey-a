/*
	* SPDX-FileCopyrightText: syuilo and misskey-project
	* SPDX-License-Identifier: AGPL-3.0-only
	*/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterClient } from '@orpc/server';
import { createRelationshipsRouter } from '../../../backend/built/features/relationships/backend.js';

const actor = { id: 'actor123', isSuspended: false, movedToUri: null, profile: { retained: true } };
const user = { id: 'user123', profile: { retained: true } };
const muting = { id: 'muting123' };
const renoteMuting = { id: 'renote-muting123' };

function createFixture(overrides = {}) {
	const calls = [];
	const deps = {
		getUser: async (...args) => { calls.push(['getUser', ...args]); return user; },
		acceptFollowRequest: async (...args) => { calls.push(['acceptFollowRequest', ...args]); },
		rejectFollowRequest: async (...args) => { calls.push(['rejectFollowRequest', ...args]); },
		findMuting: async (...args) => { calls.push(['findMuting', ...args]); return muting; },
		unmute: async (...args) => { calls.push(['unmute', ...args]); },
		isRenoteMuting: async (...args) => { calls.push(['isRenoteMuting', ...args]); return false; },
		muteRenotes: async (...args) => { calls.push(['muteRenotes', ...args]); },
		findRenoteMuting: async (...args) => { calls.push(['findRenoteMuting', ...args]); return renoteMuting; },
		unmuteRenotes: async (...args) => { calls.push(['unmuteRenotes', ...args]); },
		...overrides,
	};
	return { feature: createNativeRouter(deps), calls };
}

function createNativeRouter(deps) {
return createRelationshipsRouter({
getterService: { getUser: (...args) => deps.getUser(...args) },
userFollowingService: { acceptFollowRequest: (...args) => deps.acceptFollowRequest(...args), rejectFollowRequest: (...args) => deps.rejectFollowRequest(...args) },
userMutingService: { unmute: (...args) => deps.unmute(...args) },
userRenoteMutingService: { mute: (...args) => deps.muteRenotes(...args), unmute: (...args) => deps.unmuteRenotes(...args) },
userListService: { removeMember: (...args) => deps.removeMember(...args), addMember: (...args) => deps.addMember(...args), updateMembership: (...args) => deps.updateMembership(...args) },
idService: { gen: () => deps.generateFavoriteId() },
mutingsRepository: { findOneBy: query => deps.findMuting(query.muterId, query.muteeId) },
renoteMutingsRepository: { exists: ({ where }) => deps.isRenoteMuting(where.muterId, where.muteeId), findOneBy: query => deps.findRenoteMuting(query.muterId, query.muteeId) },
userListsRepository: { findOneBy: query => deps.findOwnedList(query.id, query.userId), delete: id => deps.deleteList(id), exists: ({ where }) => deps.findPublicList(where.id) },
userListFavoritesRepository: { exists: ({ where }) => deps.hasFavorite(where.userId, where.userListId), insert: value => deps.insertFavorite(value), findOneBy: query => deps.findFavorite(query.userListId, query.userId), delete: query => deps.deleteFavorite(query.id) },
userListMembershipsRepository: { exists: ({ where }) => deps.hasMembership(where.userListId, where.userId) },
blockingsRepository: { exists: ({ where }) => deps.hasReverseBlock(where.blockerId, where.blockeeId) },
});
}

function invoke(feature, route, input = { userId: user.id }, trustedActor = actor, token = null) {
	const context = { credential: trustedActor ? 'credential' : null, ip: '192.0.2.1', headers: {},
		services: { authenticate: async () => [trustedActor, token], limitActor: () => actor.id, rateLimitFactor: async () => 1, limit: async () => null },
	};
	return createRouterClient(feature, { context })[route](input);
}

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
	await assert.rejects(invoke(feature, 'following/requests/accept'), error => error.data?.id === '66ce1645-d66c-46bb-8b79-96739af885bd');
	assert.deepEqual(calls, []);

	const missingRequest = createFixture({
		acceptFollowRequest: async () => { throw Object.assign(new Error('missing request'), { id: '8884c2dd-5795-4ac9-b27e-6a01d38190f9' }); },
	});
	await assert.rejects(invoke(missingRequest.feature, 'following/requests/accept'), error => error.data?.id === 'bcde4f8b-0913-4614-8881-614e522fb041');
});

test('unmute commands treat null and undefined as missing without invoking the service', async () => {
	for (const [route, field, code] of [
		['mute/delete', 'findMuting', '5467d020-daa9-4553-81e1-135c0c35a96d'],
		['renote-mute/delete', 'findRenoteMuting', '2e4ef874-8bf0-4b4b-b069-4598f6d05817'],
	]) {
		for (const missing of [null, undefined]) {
			let called = false;
			const { feature } = createFixture({ [field]: async () => missing, unmute: async () => { called = true; }, unmuteRenotes: async () => { called = true; } });
			await assert.rejects(invoke(feature, route), error => error.data?.id === code);
			assert.equal(called, false);
		}
	}
});

test('native credential, scope and moved-account policy precedes relationship domain calls', async () => {
	const { feature, calls } = createFixture();
	for (const route of ['following/requests/accept', 'following/requests/reject', 'mute/delete', 'renote-mute/create', 'renote-mute/delete']) {
		await assert.rejects(invoke(feature, route, { userId: user.id }, null), error => error.code === 'CREDENTIAL_REQUIRED');
		await assert.rejects(invoke(feature, route, { userId: user.id }, actor, { permission: [] }), error => error.code === 'PERMISSION_DENIED');
	}
	await assert.rejects(invoke(feature, 'renote-mute/create', { userId: user.id }, { ...actor, movedToUri: 'https://remote.test/@moved' }), error => error.code === 'YOUR_ACCOUNT_MOVED');
	assert.deepEqual(calls, []);
});
