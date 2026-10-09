/*
	* SPDX-FileCopyrightText: syuilo and misskey-project
	* SPDX-License-Identifier: AGPL-3.0-only
	*/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterClient } from '@orpc/server';
import { createRelationshipsRouter, UserListService } from '../../../backend/built/features/relationships/backend.js';

const inputs = {
	'users/lists/delete': { listId: 'list123' },
	'users/lists/favorite': { listId: 'list123' },
	'users/lists/pull': { listId: 'list123', userId: 'user123' },
	'users/lists/push': { listId: 'list123', userId: 'user123' },
	'users/lists/unfavorite': { listId: 'list123' },
	'users/lists/update-membership': { listId: 'list123', userId: 'user123' },
};

const actor = { id: 'trusted-owner', isSuspended: false, movedToUri: null, moderator: { audit: 'retained' } };
const list = { id: 'list123', ownerId: 'trusted-owner' };
const user = { id: 'user123', profile: { details: true } };
const favorite = { id: 'favorite123' };

function createFixture(overrides = {}) {
	const calls = [];
	const deps = {
		findOwnedList: async (...args) => { calls.push(['findOwnedList', ...args]); return list; },
		deleteList: async (...args) => { calls.push(['deleteList', ...args]); },
		findPublicList: async (...args) => { calls.push(['findPublicList', ...args]); return true; },
		hasFavorite: async (...args) => { calls.push(['hasFavorite', ...args]); return false; },
		generateFavoriteId: () => { calls.push(['generateFavoriteId']); return 'generated123'; },
		insertFavorite: async (...args) => { calls.push(['insertFavorite', ...args]); },
		findFavorite: async (...args) => { calls.push(['findFavorite', ...args]); return favorite; },
		deleteFavorite: async (...args) => { calls.push(['deleteFavorite', ...args]); },
		getUser: async (...args) => { calls.push(['getUser', ...args]); return user; },
		removeMember: async (...args) => { calls.push(['removeMember', ...args]); },
		hasReverseBlock: async (...args) => { calls.push(['hasReverseBlock', ...args]); return false; },
		hasMembership: async (...args) => { calls.push(['hasMembership', ...args]); return false; },
		addMember: async (...args) => { calls.push(['addMember', ...args]); },
		updateMembership: async (...args) => { calls.push(['updateMembership', ...args]); },
		...overrides,
	};
	return { deps, calls, feature: createNativeRouter(deps) };
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

function invoke(feature, route, input = inputs[route], trustedActor = actor, token = null) {
	const context = { credential: trustedActor ? 'credential' : null, ip: '192.0.2.1', headers: {},
		services: { authenticate: async () => [trustedActor, token], limitActor: () => actor.id, rateLimitFactor: async () => 1, limit: async () => null },
	};
	return createRouterClient(feature, { context })[route](input);
}

test('all six commands preserve lookup order, trusted identity, full actor context, and void results', async () => {
	const { feature, calls } = createFixture();
	for (const [route, input] of Object.entries(inputs)) {
		const result = await invoke(feature, route, { ...input, extra: 'accepted', actor: { id: 'spoofed' } }, actor);
		assert.equal(result, undefined, route);
	}
	assert.deepEqual(calls, [
		['findOwnedList', 'list123', actor.id], ['deleteList', list.id],
		['findPublicList', 'list123'], ['hasFavorite', actor.id, 'list123'], ['generateFavoriteId'],
		['insertFavorite', { id: 'generated123', userId: actor.id, userListId: 'list123' }],
		['findOwnedList', 'list123', actor.id], ['getUser', 'user123'], ['removeMember', user, list],
		['findOwnedList', 'list123', actor.id], ['getUser', 'user123'],
		['hasReverseBlock', 'user123', actor.id], ['hasMembership', list.id, user.id], ['addMember', user, list, actor],
		['findPublicList', 'list123'], ['findFavorite', 'list123', actor.id], ['deleteFavorite', favorite.id],
		['findOwnedList', 'list123', actor.id], ['getUser', 'user123'], ['updateMembership', user, list, { withReplies: undefined }],
	]);
});

test('native credential, suspended-account and token policies reject before dependencies', async () => {
	const { feature, calls } = createFixture();
	for (const route of Object.keys(inputs)) {
		for (const principal of [null, { ...actor, isSuspended: true }]) await assert.rejects(invoke(feature, route, inputs[route], principal));
		await assert.rejects(invoke(feature, route, inputs[route], actor, { permission: [] }));
	}
	await assert.rejects(invoke(feature, 'users/lists/push', inputs['users/lists/push'], { ...actor, movedToUri: 'https://remote.test/@moved' }), error => error.code === 'YOUR_ACCOUNT_MOVED');
	assert.deepEqual(calls, []);
});

test('owned-list commands look up ownership first and map only missing lists', async () => {
	for (const [route, method] of [
		['users/lists/delete', 'deleteList'],
		['users/lists/pull', 'removeMember'],
		['users/lists/push', 'addMember'],
		['users/lists/update-membership', 'updateMembership'],
	]) {
		for (const missing of [null, undefined]) {
			const events = [];
			const fresh = createFixture({
				findOwnedList: async (...args) => { events.push(['findOwnedList', ...args]); return missing; },
				[method]: async (...args) => { events.push([method, ...args]); },
			});
			await assert.rejects(invoke(fresh.feature, route), error => {
				assert.equal(error.code, 'NO_SUCH_LIST');
				assert.equal(error.data.id, route === 'users/lists/delete' ? '78436795-db79-42f5-b1e2-55ea2cf19166'
					: route === 'users/lists/push' ? '2214501d-ac96-4049-b717-91e42272a711'
					: '7f44670e-ab16-43b8-b4c1-ccd2ee89cc02');
				return true;
			});
			assert.deepEqual(events, [['findOwnedList', 'list123', actor.id]]);
		}
	}
});

test('only the legacy getter missing-user ID is mapped, with route-specific UUIDs', async () => {
	const missingUser = Object.assign(new Error('missing'), { id: '15348ddd-432d-49c2-8a5a-8069753becff' });
	for (const [route, uuid] of [
		['users/lists/pull', '588e7f72-c744-4a61-b180-d354e912bda2'],
		['users/lists/push', 'a89abd3d-f0bc-4cce-beb1-2f446f4f1e6a'],
		['users/lists/update-membership', '588e7f72-c744-4a61-b180-d354e912bda2'],
	]) {
		const { feature } = createFixture({ getUser: async () => { throw missingUser; } });
		await assert.rejects(invoke(feature, route), error => {
			assert.equal(error.code, 'NO_SUCH_USER');
			assert.equal(error.data.id, uuid);
			return true;
		});
	}

	const unexpected = new Error('getter failure');
	const { feature } = createFixture({ getUser: async () => { throw unexpected; } });
	await assert.rejects(invoke(feature, 'users/lists/pull'), error => error === unexpected);
});

test('push checks reverse blocking before membership, skips self-block lookup, and maps only add-member limits', async () => {
	const events = [];
	const blocked = createFixture({
		hasReverseBlock: async (...args) => { events.push(['block', ...args]); return true; },
		hasMembership: async (...args) => { events.push(['membership', ...args]); return false; },
		addMember: async (...args) => { events.push(['addMember', ...args]); },
	});
	await assert.rejects(invoke(blocked.feature, 'users/lists/push'), error => {
		assert.equal(error.code, 'YOU_HAVE_BEEN_BLOCKED');
		assert.equal(error.data.id, '990232c5-3f9d-4d83-9f3f-ef27b6332a4b');
		return true;
	});
	assert.deepEqual(events, [['block', user.id, actor.id]]);

	const duplicateCalls = [];
	const duplicate = createFixture({
		hasMembership: async (...args) => { duplicateCalls.push(['membership', ...args]); return true; },
		addMember: async (...args) => { duplicateCalls.push(['addMember', ...args]); },
	});
	await assert.rejects(invoke(duplicate.feature, 'users/lists/push'), error => error.code === 'ALREADY_ADDED');
	assert.deepEqual(duplicateCalls, [['membership', list.id, user.id]]);

	const self = { id: user.id, isSuspended: false, movedToUri: null, full: 'actor context' };
	const selfCalls = [];
	const selfPush = createFixture({
		getUser: async () => user,
		hasReverseBlock: async (...args) => { selfCalls.push(['block', ...args]); return false; },
		addMember: async (...args) => { selfCalls.push(['addMember', ...args]); },
	});
	await invoke(selfPush.feature, 'users/lists/push', inputs['users/lists/push'], self);
	assert.deepEqual(selfCalls, [['addMember', user, list, self]]);

	const tooMany = new UserListService.TooManyUsersError();
	const capped = createFixture({ addMember: async () => { throw tooMany; } });
	await assert.rejects(invoke(capped.feature, 'users/lists/push'), error => {
		assert.equal(error.code, 'TOO_MANY_USERS');
		assert.equal(error.data.id, '2dd9752e-a338-413d-8eec-41814430989b');
		return true;
	});

	const unexpected = new Error('add failed');
	const failed = createFixture({ addMember: async () => { throw unexpected; } });
	await assert.rejects(invoke(failed.feature, 'users/lists/push'), error => error === unexpected);
});

test('favorite checks public visibility and duplicates before generating an ID', async () => {
	const hiddenEvents = [];
	const hidden = createFixture({
		findPublicList: async (...args) => { hiddenEvents.push(['public', ...args]); return false; },
		hasFavorite: async (...args) => { hiddenEvents.push(['favorite', ...args]); return false; },
		generateFavoriteId: () => { hiddenEvents.push(['generate']); return 'never'; },
	});
	await assert.rejects(invoke(hidden.feature, 'users/lists/favorite'), error => error.code === 'NO_SUCH_USER_LIST');
	assert.deepEqual(hiddenEvents, [['public', 'list123']]);

	const duplicateEvents = [];
	const duplicate = createFixture({
		hasFavorite: async (...args) => { duplicateEvents.push(['favorite', ...args]); return true; },
		generateFavoriteId: () => { duplicateEvents.push(['generate']); return 'never'; },
		insertFavorite: async (...args) => { duplicateEvents.push(['insert', ...args]); },
	});
	await assert.rejects(invoke(duplicate.feature, 'users/lists/favorite'), error => error.code === 'ALREADY_FAVORITED');
	assert.deepEqual(duplicateEvents, [['favorite', actor.id, 'list123']]);
});

test('unfavorite preserves list-first ordering, null-only missing check, and legacy error code', async () => {
	const events = [];
	const noFavorite = createFixture({
		findPublicList: async (...args) => { events.push(['public', ...args]); return true; },
		findFavorite: async (...args) => { events.push(['favorite', ...args]); return null; },
		deleteFavorite: async (...args) => { events.push(['delete', ...args]); },
	});
	await assert.rejects(invoke(noFavorite.feature, 'users/lists/unfavorite'), error => {
		assert.equal(error.code, 'ALREADY_FAVORITED');
		assert.equal(error.data.id, '835c4b27-463d-4cfa-969b-a9058678d465');
		return true;
	});
	assert.deepEqual(events, [['public', 'list123'], ['favorite', 'list123', actor.id]]);

	const undefinedResult = createFixture({ findFavorite: async () => undefined });
	await assert.rejects(invoke(undefinedResult.feature, 'users/lists/unfavorite'), TypeError);
});

test('update-membership preserves both omitted and explicit withReplies values', async () => {
	for (const [input, expected] of [
		[inputs['users/lists/update-membership'], undefined],
		[{ ...inputs['users/lists/update-membership'], withReplies: false }, false],
		[{ ...inputs['users/lists/update-membership'], withReplies: true }, true],
	]) {
		const calls = [];
		const { feature } = createFixture({ updateMembership: async (...args) => { calls.push(args); } });
		await invoke(feature, 'users/lists/update-membership', input);
		assert.deepEqual(calls, [[user, list, { withReplies: expected }]]);
	}
});

test('each command waits for its final side effect and resolves with undefined', async () => {
	for (const [route, method] of [
		['users/lists/delete', 'deleteList'],
		['users/lists/favorite', 'insertFavorite'],
		['users/lists/pull', 'removeMember'],
		['users/lists/push', 'addMember'],
		['users/lists/unfavorite', 'deleteFavorite'],
		['users/lists/update-membership', 'updateMembership'],
	]) {
		let release;
		let notifyStarted;
		const started = new Promise(resolve => { notifyStarted = resolve; });
		const { deps } = createFixture({
			[method]: async () => {
				notifyStarted();
				await new Promise(resolve => { release = resolve; });
			},
		});
		const feature = createNativeRouter(deps);
		let settled = false;
		const result = invoke(feature, route).then(value => { settled = true; return value; });
		await started;
		assert.equal(settled, false, route);
		release();
		assert.equal(await result, undefined, route);
		assert.equal(settled, true, route);
	}
});

test('malformed identifiers are rejected before dependencies while extension fields remain accepted', async () => {
	const { feature, calls } = createFixture();
	for (const [route, input] of Object.entries(inputs)) {
		for (const field of Object.keys(input)) {
			await assert.rejects(invoke(feature, route, { ...input, [field]: 'bad:id' }));
		}
	}
	await invoke(feature, 'users/lists/delete', { listId: 'list123', ignored: { nested: true } });
	assert.deepEqual(calls, [['findOwnedList', 'list123', actor.id], ['deleteList', list.id]]);
});
