/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as v from 'valibot';
import { createProcedureClient } from '@orpc/server';
import { chatApiContract, createChatRouter, ChatMessageAccessError } from '../../../backend/built/features/chat/backend.js';

const inputs = {
	'chat/read-all': {},
	'chat/rooms/join': { roomId: 'room1' },
	'chat/rooms/leave': { roomId: 'room1' },
	'chat/rooms/mute': { roomId: 'room1', mute: true },
	'chat/rooms/delete': { roomId: 'room1' },
	'chat/rooms/invitations/ignore': { roomId: 'room1' },
	'chat/messages/react': { messageId: 'message1', reaction: '' },
	'chat/messages/unreact': { messageId: 'message1', reaction: '' },
	'chat/messages/delete': { messageId: 'message1' },
};

function createDeps(overrides = {}) {
	const calls = [];
	const deps = {
		checkChatAvailability: async (userId, mode) => { calls.push(['gate', userId, mode]); },
		readAllChatMessages: async userId => { calls.push(['readAllChatMessages', userId]); },
		joinToRoom: async (userId, roomId) => { calls.push(['joinToRoom', userId, roomId]); },
		leaveRoom: async (userId, roomId) => { calls.push(['leaveRoom', userId, roomId]); },
		muteRoom: async (userId, roomId, mute) => { calls.push(['muteRoom', userId, roomId, mute]); },
		ignoreRoomInvitation: async (userId, roomId) => { calls.push(['ignoreRoomInvitation', userId, roomId]); },
		react: async (messageId, userId, reaction) => { calls.push(['react', messageId, userId, reaction]); },
		unreact: async (messageId, userId, reaction) => { calls.push(['unreact', messageId, userId, reaction]); },
		findMyMessageById: async (userId, messageId) => { calls.push(['findMyMessageById', userId, messageId]); return { messageId }; },
		deleteMessage: async message => { calls.push(['deleteMessage', message]); },
		findRoomById: async roomId => { calls.push(['findRoomById', roomId]); return { roomId }; },
		hasPermissionToDeleteRoom: async (userId, room) => { calls.push(['hasPermissionToDeleteRoom', userId, room]); return true; },
		deleteRoom: async (room, actor) => { calls.push(['deleteRoom', room, actor]); },
		...overrides,
	};
	return { deps, calls };
}

function methodName(route) {
	return route.split(/[/-]/).map((part, index) => index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)).join('');
}

function createCommandRouter(chatService) {
	return createChatRouter(Object.fromEntries(Object.keys(chatApiContract).map(key => [key, { chatService }])));
}

function invoke(feature, key, input = inputs[key], actor = { id: 'alice', isSuspended: false, movedToUri: null }) {
	const services = {
		authenticate: async () => [actor ?? null, null],
		limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null,
	};
	const procedure = feature[methodName(key)];
	return createProcedureClient(procedure, { context: {
		services, credential: actor ? 'fixture' : null, ip: '127.0.0.1', headers: {},
	} })(input);
}

test('native command inputs retain required IDs and reject non-object roots', () => {
	for (const [route, input] of Object.entries(inputs)) {
		const schema = chatApiContract[methodName(route)]['~orpc'].inputSchema;
		assert.equal(v.safeParse(schema, input).success, true, route);
		assert.equal(v.safeParse(schema, []).success, false, route);
		assert.equal(v.safeParse(schema, {}).success, route === 'chat/read-all', route);
	}
	const schema = chatApiContract.chatMessagesReact['~orpc'].inputSchema;
	assert.equal(v.safeParse(schema, { messageId: 'message1', reaction: '😀'.repeat(2048) }).success, true);
});

test('commands use the correct gate, trusted actor, and service arguments; every success is void', async () => {
	const actor = { id: 'trusted-alice', moderator: { auditData: true } };
	const { deps, calls } = createDeps();
	const feature = createCommandRouter(deps);

	for (const [key, input] of Object.entries(inputs)) {
		const result = await invoke(feature, key, { ...input, extraField: 'accepted', actor: { id: 'spoofed' } }, actor);
		assert.equal(result, undefined, key);
	}

	assert.deepEqual(calls, [
		['gate', actor.id, 'read'], ['readAllChatMessages', actor.id],
		['gate', actor.id, 'write'], ['joinToRoom', actor.id, 'room1'],
		['gate', actor.id, 'write'], ['leaveRoom', actor.id, 'room1'],
		['gate', actor.id, 'write'], ['muteRoom', actor.id, 'room1', true],
		['gate', actor.id, 'write'], ['findRoomById', 'room1'],
		['hasPermissionToDeleteRoom', actor.id, { roomId: 'room1' }], ['deleteRoom', { roomId: 'room1' }, actor],
		['gate', actor.id, 'write'], ['ignoreRoomInvitation', actor.id, 'room1'],
		['gate', actor.id, 'write'], ['react', 'message1', actor.id, ''],
		['gate', actor.id, 'write'], ['unreact', 'message1', actor.id, ''],
		['gate', actor.id, 'write'], ['findMyMessageById', actor.id, 'message1'], ['deleteMessage', { messageId: 'message1' }],
	]);
});

test('missing or suspended authenticated actors fail before calling any dependency', async () => {
	const { deps, calls } = createDeps();
	const feature = createCommandRouter(deps);
	for (const [key, input] of Object.entries(inputs)) {
		for (const actor of [null, { id: 'alice', isSuspended: true, movedToUri: null }]) await assert.rejects(invoke(feature, key, input, actor));
	}
	assert.deepEqual(calls, []);
});

test('trusted actors stay isolated across concurrent calls, including full room-delete context', async () => {
	const actors = [{ id: 'actor-one', audit: 'one' }, { id: 'actor-two', audit: 'two' }];
	const started = [];
	const releases = new Map();
	let notifyBothStarted;
	const bothStarted = new Promise(resolve => { notifyBothStarted = resolve; });
	const deletedBy = [];
	const feature = createCommandRouter(createDeps({
		findRoomById: roomId => new Promise(resolve => {
			started.push(roomId);
			releases.set(roomId, () => resolve({ roomId }));
			if (started.length === 2) notifyBothStarted();
		}),
		deleteRoom: async (room, actor) => { deletedBy.push([room.roomId, actor]); },
	}).deps);

	const first = invoke(feature, 'chat/rooms/delete', { roomId: 'one', actor: { id: 'spoof-one' } }, actors[0]);
	const second = invoke(feature, 'chat/rooms/delete', { roomId: 'two', actor: { id: 'spoof-two' } }, actors[1]);
	await bothStarted;
	releases.get('two')();
	await second;
	releases.get('one')();
	await first;
	assert.deepEqual(deletedBy, [['two', actors[1]], ['one', actors[0]]]);
});

test('every command waits for its availability gate before starting its work', async () => {
	for (const [key, input] of Object.entries(inputs)) {
		const events = [];
		let releaseGate;
		let notifyGateStarted;
		const gateStarted = new Promise(resolve => { notifyGateStarted = resolve; });
		const { deps } = createDeps({
			checkChatAvailability: async () => {
				events.push('gate-start');
			notifyGateStarted();
				await new Promise(resolve => { releaseGate = resolve; });
				events.push('gate-finish');
			},
		});
		for (const method of [
			'readAllChatMessages', 'joinToRoom', 'leaveRoom', 'muteRoom', 'ignoreRoomInvitation',
			'react', 'unreact', 'findMyMessageById', 'deleteMessage', 'findRoomById', 'hasPermissionToDeleteRoom', 'deleteRoom',
		]) {
			deps[method] = async () => { events.push(`command:${method}`); return method === 'findRoomById' ? { roomId: 'room1' } : method === 'findMyMessageById' ? { messageId: 'message1' } : method === 'hasPermissionToDeleteRoom' ? true : undefined; };
		}
		const feature = createCommandRouter(deps);
		let settled = false;
		const result = invoke(feature, key, input).then(() => { settled = true; });
		await gateStarted;
		assert.deepEqual(events, ['gate-start'], key);
		assert.equal(settled, false, key);
		releaseGate();
		await result;
		assert.equal(events[0], 'gate-start', key);
		assert.equal(events[1], 'gate-finish', key);
		assert.equal(events.some(event => event.startsWith('command:')), true, key);
	}
});

test('react and unreact conceal only access errors and retain route-specific errors', async () => {
	for (const [key, action] of [['chat/messages/react', 'react'], ['chat/messages/unreact', 'unreact']]) {
		const denied = new ChatMessageAccessError('private reason');
		const { deps, calls } = createDeps({ [action]: async () => { throw denied; } });
		const feature = createCommandRouter(deps);
		await assert.rejects(invoke(feature, key), error => {
			assert.equal(error.data.id, key.endsWith('/react') && !key.endsWith('/unreact')
				? '9b5839b9-0ba0-4351-8c35-37082093d200'
				: 'c39ea42f-e3ca-428a-ad57-390e0a711595');
			assert.equal(error.code, 'NO_SUCH_MESSAGE');
			return true;
		});
		assert.equal(calls[0][0], 'gate');

		const unexpected = new Error('unexpected failure');
		const otherFeature = createCommandRouter(createDeps({ [action]: async () => { throw unexpected; } }).deps);
		await assert.rejects(invoke(otherFeature, key), error => error === unexpected);

		const gateError = new Error('availability denied');
		let actionCalled = false;
		const gatedFeature = createCommandRouter(createDeps({
			checkChatAvailability: async () => { throw gateError; },
			[action]: async () => { actionCalled = true; },
		}).deps);
		await assert.rejects(invoke(gatedFeature, key), error => error === gateError);
		assert.equal(actionCalled, false);
	}
});

test('message deletion and room deletion conceal absence and permission failures', async () => {
	const messageFeature = createCommandRouter(createDeps({ findMyMessageById: async () => null }).deps);
	await assert.rejects(invoke(messageFeature, 'chat/messages/delete'), error => {
		assert.equal(error.data.id, '36b67f0e-66a6-414b-83df-992a55294f17');
		return true;
	});

	for (const [room, allowed] of [[null, true], [{ id: 'room' }, false]]) {
		let deleteCalled = false;
		const feature = createCommandRouter(createDeps({
			findRoomById: async () => room,
			hasPermissionToDeleteRoom: async () => allowed,
			deleteRoom: async () => { deleteCalled = true; },
		}).deps);
		await assert.rejects(invoke(feature, 'chat/rooms/delete'), error => {
			assert.equal(error.data.id, 'd4e3753d-97bf-4a19-ab8e-21080fbc0f4b');
			return true;
		});
		assert.equal(deleteCalled, false);
	}
});

test('chat inputs retain old malformed behavior and permit unrecognized object properties', async () => {
	const { deps, calls } = createDeps();
	const feature = createCommandRouter(deps);

	for (const [key, input] of Object.entries({
		'chat/rooms/join': { roomId: 'bad id' },
		'chat/rooms/mute': { roomId: 'room1', mute: 'true' },
		'chat/messages/react': { messageId: 'message1', reaction: true },
	})) {
		await assert.rejects(invoke(feature, key, input));
	}

	await invoke(feature, 'chat/read-all', { ignored: { any: 'value' } });
	await invoke(feature, 'chat/messages/react', { messageId: 'message1', reaction: '', ignored: 'ok' });
	assert.equal(calls.some(call => call[0] === 'readAllChatMessages'), true);
	assert.equal(calls.some(call => call[0] === 'react' && call[3] === ''), true);
});

test('async command methods await dependencies and resolve with undefined', async () => {
	for (const [key, method] of [
		['chat/read-all', 'readAllChatMessages'],
		['chat/rooms/join', 'joinToRoom'],
		['chat/rooms/leave', 'leaveRoom'],
		['chat/rooms/mute', 'muteRoom'],
		['chat/rooms/invitations/ignore', 'ignoreRoomInvitation'],
		['chat/messages/react', 'react'],
		['chat/messages/unreact', 'unreact'],
		['chat/messages/delete', 'findMyMessageById'],
		['chat/rooms/delete', 'findRoomById'],
	]) {
		let release;
		let notifyStarted;
		const started = new Promise(resolve => { notifyStarted = resolve; });
		const { deps } = createDeps({
			[method]: () => {
				notifyStarted();
				return new Promise(resolve => { release = () => resolve(method === 'findRoomById' ? { roomId: 'room1' } : method === 'findMyMessageById' ? { messageId: 'message1' } : undefined); });
			},
		});
		const feature = createCommandRouter(deps);
		let settled = false;
		const result = invoke(feature, key).then(value => { settled = true; return value; });
		await started;
		assert.equal(settled, false, key);
		release();
		assert.equal(await result, undefined, key);
		assert.equal(settled, true, key);
	}

	for (const [key, finalMethod] of [
		['chat/messages/delete', 'deleteMessage'],
		['chat/rooms/delete', 'deleteRoom'],
	]) {
		let release;
		let notifyStarted;
		const started = new Promise(resolve => { notifyStarted = resolve; });
		const { deps } = createDeps({
			[finalMethod]: () => {
				notifyStarted();
				return new Promise(resolve => { release = resolve; });
			},
		});
		const feature = createCommandRouter(deps);
		let settled = false;
		const result = invoke(feature, key).then(value => { settled = true; return value; });
		await started;
		assert.equal(settled, false, key);
		release();
		assert.equal(await result, undefined, key);
		assert.equal(settled, true, key);
	}
});
