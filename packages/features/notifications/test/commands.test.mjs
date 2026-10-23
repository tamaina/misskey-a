/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as v from 'valibot';
import { notificationsContract } from '../../../misskey-js/built/contracts/notifications/backend/endpoints/notifications.contract.js';
import { createProcedureClient } from '@orpc/server';
import { createCreateProcedure, createFlushProcedure, createMarkAllAsReadProcedure, createTestNotificationProcedure } from '../../../backend/built/features/notifications/backend.js';

function createDeps(overrides = {}) {
	const calls = [];
	const deps = {
		createAppNotification: (userId, data) => { calls.push(['createAppNotification', userId, data]); },
		createTestNotification: userId => { calls.push(['createTestNotification', userId]); },
		flushAllNotifications: userId => { calls.push(['flushAllNotifications', userId]); },
		readAllNotification: (userId, markRead) => { calls.push(['readAllNotification', userId, markRead]); },
		...overrides,
	};
	return { deps, calls };
}

function createCommandProcedures(deps) {
	return {
		'notifications/create': createCreateProcedure(deps),
		'notifications/flush': createFlushProcedure(deps),
		'notifications/mark-all-as-read': createMarkAllAsReadProcedure(deps),
		'notifications/test-notification': createTestNotificationProcedure(deps),
	};
}

function invoke(feature, command, input = {}, trusted = { actor: { id: 'user1' }, token: null }) {
	const actor = trusted?.actor && typeof trusted.actor.id === 'string' && trusted.actor.id.length > 0 ? trusted.actor : null;
	const token = trusted?.token ? { ...trusted.token, permission: ['write:notifications'] } : null;
	return createProcedureClient(feature[command], { context: {
		credential: actor ? 'fixture' : null, ip: '127.0.0.1', headers: {},
		services: { authenticate: async () => [actor, token], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null },
	} })(input);
}

test('native notification inputs preserve required and nullable optional fields', () => {
	const create = notificationsContract.create['~orpc'].inputSchema;
	assert.deepEqual(v.parse(create, { body: 'hello', header: null, icon: null, extra: true }), { body: 'hello', header: null, icon: null });
	assert.equal(v.safeParse(create, {}).success, false);
	for (const key of ['flush', 'markAllAsRead', 'testNotification']) {
		const input = notificationsContract[key]['~orpc'].inputSchema;
		assert.deepEqual(v.parse(input, { extra: true }), {});
		assert.equal(v.safeParse(input, []).success, false);
	}
});

test('create validates body and nullable optional strings while retaining extra fields', async () => {
	const { deps, calls } = createDeps();
	const feature = createCommandProcedures(deps);

	await invoke(feature, 'notifications/create', {
		body: 'hello', header: null, icon: 'https://example.test/icon.png', extraField: { retained: true },
	});
	assert.deepEqual(calls, [[
		'createAppNotification', 'user1', {
			appAccessTokenId: null,
			customBody: 'hello',
			customHeader: null,
			customIcon: 'https://example.test/icon.png',
		},
	]]);

	await assert.rejects(invoke(feature, 'notifications/create', {}));
	await assert.rejects(invoke(feature, 'notifications/create', { body: 1 }));
	await assert.rejects(invoke(feature, 'notifications/create', { body: 'hello', header: false }));
	await assert.rejects(invoke(feature, 'notifications/create', { body: 'hello', icon: {} }));
});

test('create uses trusted token fallbacks and explicit header/icon values override them', async () => {
	const { deps, calls } = createDeps();
	const feature = createCommandProcedures(deps);
	const token = { id: 'token1', name: 'My app', iconUrl: 'https://example.test/app.png' };

	await invoke(feature, 'notifications/create', { body: 'one' }, { actor: { id: 'alice' }, token });
	await invoke(feature, 'notifications/create', {
		body: 'two', header: 'Override', icon: null,
	}, { actor: { id: 'bob' }, token });
	await invoke(feature, 'notifications/create', {
		body: 'three', header: null, icon: 'https://example.test/custom.png',
	}, { actor: { id: 'carol' }, token });

	assert.deepEqual(calls, [
		['createAppNotification', 'alice', {
			appAccessTokenId: 'token1', customBody: 'one', customHeader: 'My app', customIcon: 'https://example.test/app.png',
		}],
		['createAppNotification', 'bob', {
			appAccessTokenId: 'token1', customBody: 'two', customHeader: 'Override', customIcon: 'https://example.test/app.png',
		}],
		['createAppNotification', 'carol', {
			appAccessTokenId: 'token1', customBody: 'three', customHeader: 'My app', customIcon: 'https://example.test/custom.png',
		}],
	]);
});

test('all routes require the trusted actor before side effects; input actor/token cannot spoof context', async () => {
	const { deps, calls } = createDeps();
	const feature = createCommandProcedures(deps);
	const commands = [
		['notifications/create', { body: 'hello' }],
		['notifications/flush', {}],
		['notifications/mark-all-as-read', {}],
		['notifications/test-notification', {}],
	];

	for (const [command, input] of commands) {
		await assert.rejects(invoke(feature, command, { ...input, actor: { id: 'spoofed' }, token: { id: 'spoofed' } }, null));
		for (const actor of [null, {}, { id: '' }]) {
			await assert.rejects(invoke(feature, command, { ...input, actor: { id: 'spoofed' }, token: { id: 'spoofed' } }, { actor, token: null }));
		}
	}
	assert.deepEqual(calls, []);
});

test('concurrent notification commands use their own trusted actors and tokens', async () => {
	const pending = new Map();
	let notifyBothStarted;
	const bothStarted = new Promise(resolve => { notifyBothStarted = resolve; });
	const feature = createCommandProcedures(createDeps({
		createAppNotification: (userId, data) => new Promise(resolve => {
			pending.set(userId, { data, resolve });
			if (pending.size === 2) notifyBothStarted();
		}),
	}).deps);

	const first = invoke(feature, 'notifications/create', { body: 'first', actor: { id: 'spoof-one' } }, {
		actor: { id: 'alice' }, token: { id: 'token-a', name: 'A', iconUrl: null },
	});
	const second = invoke(feature, 'notifications/create', { body: 'second', token: { id: 'spoof-two' } }, {
		actor: { id: 'bob' }, token: { id: 'token-b', name: 'B', iconUrl: null },
	});
	await bothStarted;

	assert.deepEqual(pending.get('alice').data, {
		appAccessTokenId: 'token-a', customBody: 'first', customHeader: 'A', customIcon: null,
	});
	assert.deepEqual(pending.get('bob').data, {
		appAccessTokenId: 'token-b', customBody: 'second', customHeader: 'B', customIcon: null,
	});
	pending.get('bob').resolve();
	pending.get('alice').resolve();
	await Promise.all([first, second]);
});

test('notification handlers do not await returned promises and return void', async () => {
	const never = new Promise(() => {});
	const calls = [];
	const feature = createCommandProcedures({
		createAppNotification: (...args) => { calls.push(['createAppNotification', ...args]); return never; },
		createTestNotification: (...args) => { calls.push(['createTestNotification', ...args]); return never; },
		flushAllNotifications: (...args) => { calls.push(['flushAllNotifications', ...args]); return never; },
		readAllNotification: (...args) => { calls.push(['readAllNotification', ...args]); return never; },
	});

	for (const [command, input, expected] of [
		['notifications/create', { body: 'hello' }, ['createAppNotification', 'user1', {
			appAccessTokenId: null, customBody: 'hello', customHeader: null, customIcon: null,
		}]],
		['notifications/flush', {}, ['flushAllNotifications', 'user1']],
		['notifications/mark-all-as-read', {}, ['readAllNotification', 'user1', true]],
		['notifications/test-notification', {}, ['createTestNotification', 'user1']],
	]) {
		assert.equal(await invoke(feature, command, input), undefined);
		assert.deepEqual(calls.at(-1), expected);
	}
});

test('notification handlers surface synchronous service errors', async () => {
	for (const [command, input, method] of [
		['notifications/create', { body: 'hello' }, 'createAppNotification'],
		['notifications/flush', {}, 'flushAllNotifications'],
		['notifications/mark-all-as-read', {}, 'readAllNotification'],
		['notifications/test-notification', {}, 'createTestNotification'],
	]) {
		const failure = new Error(`${method} failed`);
		const feature = createCommandProcedures({
			createAppNotification: () => { if (method === 'createAppNotification') throw failure; },
			createTestNotification: () => { if (method === 'createTestNotification') throw failure; },
			flushAllNotifications: () => { if (method === 'flushAllNotifications') throw failure; },
			readAllNotification: () => { if (method === 'readAllNotification') throw failure; },
		});
		await assert.rejects(invoke(feature, command, input), error => error === failure);
	}
});

test('flush, mark-all-as-read and test notification dispatch their exact service calls', async () => {
	const { deps, calls } = createDeps();
	const feature = createCommandProcedures(deps);

	await invoke(feature, 'notifications/flush', {}, { actor: { id: 'u1' }, token: null });
	await invoke(feature, 'notifications/mark-all-as-read', {}, { actor: { id: 'u2' }, token: null });
	await invoke(feature, 'notifications/test-notification', {}, { actor: { id: 'u3' }, token: null });

	assert.deepEqual(calls, [
		['flushAllNotifications', 'u1'],
		['readAllNotification', 'u2', true],
		['createTestNotification', 'u3'],
	]);
});
