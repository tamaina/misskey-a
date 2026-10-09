/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as v from 'valibot';
import { createProcedureClient } from '@orpc/server';
import { createChannelCommandOperations, channelsApiContract, createChannelsRouter } from '../../../backend/built/features/channels/backend.js';

const routes = [
	'channels/follow',
	'channels/unfollow',
	'channels/favorite',
	'channels/unfavorite',
	'channels/mute/create',
	'channels/mute/delete',
];
const inputs = Object.fromEntries(routes.map(route => [route, { channelId: 'channel123' }]));
const actor = { id: 'trusted-user', isSuspended: false, movedToUri: null, extra: { retained: true } };
const channel = { id: 'channel123', ownerId: 'channel-owner', extra: { retained: true } };
const now = 1_700_000_000_000;

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
		findById: async (...args) => { calls.push(['findById', ...args]); return channel; },
		follow: async (...args) => { calls.push(['follow', ...args]); },
		unfollow: async (...args) => { calls.push(['unfollow', ...args]); },
		isAlreadyFollowingError: error => error?.id === '6e335e39-0203-4418-a936-b3f2dc987845',
		generateFavoriteId: () => { calls.push(['generateFavoriteId']); return 'generated-favorite-id'; },
		insertFavorite: async (...args) => { calls.push(['insertFavorite', ...args]); },
		deleteFavorite: async (...args) => { calls.push(['deleteFavorite', ...args]); },
		isMuted: async (...args) => { calls.push(['isMuted', ...args]); return false; },
		mute: async (...args) => { calls.push(['mute', ...args]); },
		unmute: async (...args) => { calls.push(['unmute', ...args]); },
		now: () => { calls.push(['now']); return now; },
		createError: makeError,
		...overrides,
	};
	return { deps, calls, feature: createChannelCommandOperations(deps) };
}

function methodName(route) {
	return route.split(/[/-]/).map((part, index) => index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)).join('');
}

function invoke(feature, route, input = inputs[route], trustedActor = actor) {
	const services = {
		authenticate: async () => [trustedActor ?? null, null],
		limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null,
	};
	const procedure = createChannelsRouter()[methodName(route)];
	return createProcedureClient(procedure, { context: {
		services, credential: trustedActor ? 'fixture' : null, ip: '127.0.0.1', headers: {},
		operations: { channels: feature },
	} })(input);
}

test('native command inputs retain required IDs and reject non-object roots', () => {
	for (const [route, input] of Object.entries(inputs)) {
		const schema = channelsApiContract[methodName(route)]['~orpc'].inputSchema;
		assert.equal(v.safeParse(schema, input).success, true, route);
		assert.equal(v.safeParse(schema, []).success, false, route);
		assert.equal(v.safeParse(schema, {}).success, route === 'chat/read-all', route);
	}
	const schema = channelsApiContract.channelsMuteCreate['~orpc'].inputSchema;
	for (const expiresAt of [null, 0, 1]) assert.equal(v.safeParse(schema, { channelId: channel.id, expiresAt }).success, true);
	for (const expiresAt of [1.5, Infinity, '1']) assert.equal(v.safeParse(schema, { channelId: channel.id, expiresAt }).success, false);
});

test('six commands preserve lookup order, trusted actor identity, extra fields, and void results', async () => {
	let mutedChecks = 0;
	const { calls, feature } = createFixture({
		isMuted: async (...args) => { calls.push(['isMuted', ...args]); return ++mutedChecks > 1; },
	});
	for (const route of routes) {
		const result = await invoke(feature, route, { ...inputs[route], extra: 'ignored', actor: { id: 'spoofed' } });
		assert.equal(result, undefined, route);
	}
	assert.deepEqual(calls, [
		['findById', 'channel123'], ['follow', actor, channel],
		['findById', 'channel123'], ['unfollow', actor, channel],
		['findById', 'channel123'], ['generateFavoriteId'],
		['insertFavorite', { id: 'generated-favorite-id', userId: actor.id, channelId: channel.id }],
		['findById', 'channel123'], ['deleteFavorite', actor.id, channel.id],
		['findById', 'channel123'], ['isMuted', { requestUserId: actor.id, targetChannelId: channel.id }],
		['mute', { requestUserId: actor.id, targetChannelId: channel.id, expiresAt: null }],
		['findById', 'channel123'], ['isMuted', { requestUserId: actor.id, targetChannelId: channel.id }],
		['unmute', { requestUserId: actor.id, targetChannelId: channel.id }],
	]);
});

test('all routes require an active authenticated actor before calling any port', async () => {
	const { calls, feature } = createFixture();
	for (const route of routes) {
		await assert.rejects(invoke(feature, route, inputs[route], null), { code: 'CREDENTIAL_REQUIRED' });
		await assert.rejects(invoke(feature, route, inputs[route], { ...actor, isSuspended: true }), { code: 'YOUR_ACCOUNT_SUSPENDED' });
		await assert.rejects(invoke(feature, route, inputs[route], { ...actor, movedToUri: 'https://example.com/moved' }), { code: 'YOUR_ACCOUNT_MOVED' });
	}
	assert.deepEqual(calls, []);
});

test('missing channels retain each route-specific public error identity and message', async () => {
	const missing = [
		['channels/follow', 'c0031718-d573-4e85-928e-10039f1fbb68', 'No such channel.'],
		['channels/unfollow', '19959ee9-0153-4c51-bbd9-a98c49dc59d6', 'No such channel.'],
		['channels/favorite', '4938f5f3-6167-4c04-9149-6607b7542861', 'No such channel.'],
		['channels/unfavorite', '353c68dd-131a-476c-aa99-88a345e83668', 'No such channel.'],
		['channels/mute/create', '7174361e-d58f-31d6-2e7c-6fb830786a3f', 'No such Channel.'],
		['channels/mute/delete', 'e7998769-6e94-d9c2-6b8f-94a527314aba', 'No such Channel.'],
	];
	for (const [route, id, message] of missing) {
		for (const absent of [null, undefined]) {
			const { calls, feature } = createFixture({ findById: async (...args) => { calls.push(['findById', ...args]); return absent; } });
			await assert.rejects(invoke(feature, route), error => {
				assert.equal(error.code, 'NO_SUCH_CHANNEL');
				assert.equal(error.id, id);
				assert.equal(error.message, message);
				return true;
			});
			assert.deepEqual(calls, [['findById', 'channel123']], route);
		}
	}
});

test('follow maps only the injected duplicate classifier and rethrows other failures unchanged', async () => {
	const duplicate = Object.assign(new Error('duplicate'), { id: '6e335e39-0203-4418-a936-b3f2dc987845' });
	const classifierCalls = [];
	const duplicateCase = createFixture({
		isAlreadyFollowingError: error => { classifierCalls.push(error); return error === duplicate; },
		follow: async () => { throw duplicate; },
	});
	await assert.rejects(invoke(duplicateCase.feature, 'channels/follow'), error => {
		assert.equal(error.code, 'ALREADY_FOLLOWING');
		assert.equal(error.id, '7db31665-651e-40c1-8e6e-28e9ad829a2d');
		assert.equal(error.message, 'You are already following that channel.');
		return true;
	});
	assert.deepEqual(classifierCalls, [duplicate]);

	const unexpected = new Error('service failed');
	const unexpectedCase = createFixture({
		isAlreadyFollowingError: error => { classifierCalls.push(error); return false; },
		follow: async () => { throw unexpected; },
	});
	await assert.rejects(invoke(unexpectedCase.feature, 'channels/follow'), error => error === unexpected);
	assert.equal(classifierCalls[1], unexpected);
});

test('mute creation preserves null, zero, omitted, past, and future millisecond expiry behavior', async () => {
	for (const [input, expectedExpiry] of [
		[{ channelId: channel.id }, null],
		[{ channelId: channel.id, expiresAt: null }, null],
		[{ channelId: channel.id, expiresAt: 0 }, null],
	]) {
		const { calls, feature } = createFixture();
		await invoke(feature, 'channels/mute/create', input);
		assert.deepEqual(calls, [
			['findById', channel.id], ['isMuted', { requestUserId: actor.id, targetChannelId: channel.id }],
			['mute', { requestUserId: actor.id, targetChannelId: channel.id, expiresAt: expectedExpiry }],
		]);
	}

	for (const past of [now - 1, now]) {
		const { calls, feature } = createFixture();
		await assert.rejects(invoke(feature, 'channels/mute/create', { channelId: channel.id, expiresAt: past }), error => {
			assert.equal(error.code, 'EXPIRES_AT_IS_PAST');
			assert.equal(error.id, '42b32236-df2c-a45f-fdbf-def67268f749');
			assert.equal(error.message, 'Cannot set past date to "expiresAt".');
			return true;
		});
		assert.deepEqual(calls, [
			['findById', channel.id], ['isMuted', { requestUserId: actor.id, targetChannelId: channel.id }], ['now'],
		]);
	}

	const future = now + 86_400_000;
	const { calls, feature } = createFixture();
	await invoke(feature, 'channels/mute/create', { channelId: channel.id, expiresAt: future });
	assert.deepEqual(calls, [
		['findById', channel.id], ['isMuted', { requestUserId: actor.id, targetChannelId: channel.id }], ['now'],
		['mute', { requestUserId: actor.id, targetChannelId: channel.id, expiresAt: new Date(future) }],
	]);
});

test('mute policy checks occur in order and only writes after all checks pass', async () => {
	const alreadyMutedCalls = [];
	const alreadyMuted = createFixture({
		isMuted: async (...args) => { alreadyMutedCalls.push(['isMuted', ...args]); return true; },
		mute: async (...args) => { alreadyMutedCalls.push(['mute', ...args]); },
	});
	await assert.rejects(invoke(alreadyMuted.feature, 'channels/mute/create', { channelId: channel.id, expiresAt: 0 }), error => {
		assert.equal(error.code, 'ALREADY_MUTING_CHANNEL');
		assert.equal(error.id, '5a251978-769a-da44-3e89-3931e43bb592');
		return true;
	});
	assert.deepEqual(alreadyMutedCalls, [['isMuted', { requestUserId: actor.id, targetChannelId: channel.id }]]);

	const notMutedCalls = [];
	const notMuted = createFixture({
		isMuted: async (...args) => { notMutedCalls.push(['isMuted', ...args]); return false; },
		unmute: async (...args) => { notMutedCalls.push(['unmute', ...args]); },
	});
	await assert.rejects(invoke(notMuted.feature, 'channels/mute/delete'), error => {
		assert.equal(error.code, 'NOT_MUTING_CHANNEL');
		assert.equal(error.id, '14d55962-6ea8-d990-1333-d6bef78dc2ab');
		return true;
	});
	assert.deepEqual(notMutedCalls, [['isMuted', { requestUserId: actor.id, targetChannelId: channel.id }]]);
});

test('each write command waits for its final side effect to settle', async () => {
	for (const [route, method, input] of [
		['channels/follow', 'follow', inputs['channels/follow']],
		['channels/unfollow', 'unfollow', inputs['channels/unfollow']],
		['channels/favorite', 'insertFavorite', inputs['channels/favorite']],
		['channels/unfavorite', 'deleteFavorite', inputs['channels/unfavorite']],
		['channels/mute/create', 'mute', inputs['channels/mute/create']],
		['channels/mute/delete', 'unmute', inputs['channels/mute/delete']],
	]) {
		let release;
		let started;
		const didStart = new Promise(resolve => { started = resolve; });
		let completed = false;
		const { deps, feature } = createFixture({
			isMuted: async () => method === 'unmute',
			[method]: async () => new Promise(resolve => {
				release = resolve;
				started();
			}),
		});
		assert.ok(deps);
		const pending = invoke(feature, route, input).then(() => { completed = true; });
		await didStart;
		await Promise.resolve();
		assert.equal(completed, false, route);
		release();
		await pending;
		assert.equal(completed, true, route);
	}
});
