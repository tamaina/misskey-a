/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { EventEmitter } from 'node:events';
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { Connection } from '../../backend/transport/stream/Connection.js';
import { waitForChannelReady, waitForNoteReady } from '../../../../backend/test-federation/test/channel-ready.js';
import type { BrowserSessionService } from '@features/auth/backend/services/BrowserSessionService.js';
import type { StreamEventEmitter } from '@features/runtime/backend/services/GlobalEventService.js';

// These unrelated constructors require built game packages; dispatch and the
// connection queue remain real, while the channel factory is isolated below.
vi.mock('@features/games/backend/stream/reversi.js', () => ({ ReversiChannel: class {} }));
vi.mock('@features/games/backend/stream/reversi-game.js', () => ({ ReversiGameChannel: class {} }));

async function fixture(queue: 'legacy' | 'browser-session') {
	const moduleRef = mockDeep<import('@nestjs/core').ModuleRef>();
	const sessions = mockDeep<BrowserSessionService>();
	sessions.isActive.mockResolvedValue(true);
	const connection = new Connection(moduleRef, mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), {
		user: { id: 'viewer' } as never, token: null,
		...(queue === 'browser-session' ? { browserSession: { id: 'synthetic-session', userId: 'viewer' } } : {}),
	}, sessions);
	connection.following.author = { withReplies: false };
	const events = new EventEmitter() as StreamEventEmitter;
	const stream = Object.assign(new EventEmitter(), { send: (type: string, body: unknown) => socket.emit('message', Buffer.from(JSON.stringify({ type, body }))) });
	const socket = Object.assign(new EventEmitter(), {
		readyState: 1,
		send: (wire: string) => { const frame = JSON.parse(wire) as { type: string; body: unknown }; stream.emit(frame.type, frame.body); },
	});
	moduleRef.create.mockImplementation(async (_ctor, contextId) => {
		const call = moduleRef.registerRequestByContextId.mock.calls.find(([, context]) => context === contextId);
		const request = call?.[0] as { id: string };
		return { id: request.id, init: async () => true, dispose: vi.fn() } as never;
	});
	vi.spyOn(connection, 'getChannelConstructor').mockReturnValue({ requireCredential: false } as never);
	await connection.listen(events, socket as never);
	let release!: (allowed: boolean) => void;
	let entered!: () => void;
	const reached = new Promise<void>(resolve => { entered = resolve; });
	vi.spyOn(connection, 'checkBrowserSession').mockImplementationOnce(() => {
		entered();
		return new Promise<boolean>(resolve => { release = resolve; });
	});
	return { connection, events, stream, reached, release: () => release(true) };
}

test.each((['legacy', 'browser-session'] as const).flatMap(queue => (['public', 'followers', 'specified'] as const).map(visibility => ({ queue, visibility }))))('real $queue socket dispatch registers note subscription before deletion ($visibility)', async ({ queue, visibility }) => {
	const publish = (events: StreamEventEmitter) => events.emit('noteStream:note', {
		type: 'deleted', body: { id: 'note', userId: 'author', visibility, visibleUserIds: ['viewer'], body: { deletedAt: 'synthetic-time' } },
	} as never);
	// Force the historical ordering without relying on machine speed or a sleep.
	const early = await fixture(queue);
	const missed = vi.fn(); early.stream.on('noteUpdated', missed);
	try {
		early.stream.send('s', { id: 'note' });
		await early.reached;
		expect(early.events.listenerCount('noteStream:note')).toBe(0);
		publish(early.events);
		expect(missed).not.toHaveBeenCalled();
	} finally {
		early.release();
		try {
			await waitForChannelReady(early.stream, crypto.randomUUID(), 'main', {}, 10_000);
		} finally {
			early.connection.dispose();
		}
		expect(early.events.listenerCount('noteStream:note')).toBe(0);
	}

	const guarded = await fixture(queue);
	const received = vi.fn(); guarded.stream.on('noteUpdated', received);
	const delivered = new Promise<void>(resolve => guarded.stream.once('noteUpdated', () => resolve()));
	const trigger = vi.fn(() => {
		expect(guarded.events.listenerCount('noteStream:note')).toBe(1);
		publish(guarded.events);
	});
	try {
		const ready = waitForNoteReady(guarded.stream, 'note', 10_000).then(trigger);
		await guarded.reached;
		expect(trigger).not.toHaveBeenCalled();
		expect(guarded.events.listenerCount('noteStream:note')).toBe(0);
		guarded.release();
		await ready;
		await delivered;
		expect(trigger).toHaveBeenCalledOnce();
		expect(received).toHaveBeenCalledExactlyOnceWith({ id: 'note', type: 'deleted', body: { deletedAt: 'synthetic-time' } });
		expect(guarded.stream.listenerCount('connected')).toBe(0);
		expect(guarded.stream.listenerCount('_disconnected_')).toBe(0);
	} finally { guarded.connection.dispose(); }
});

test('note subscription barrier rejects a disconnect before triggering deletion', async () => {
	const stream = Object.assign(new EventEmitter(), { send: vi.fn() });
	const trigger = vi.fn();
	const ready = waitForNoteReady(stream, 'note', 10_000).then(trigger);
	stream.emit('_disconnected_');
	await expect(ready).rejects.toThrow('Stream disconnected before channel acknowledgement');
	expect(stream.send.mock.calls[0]).toEqual(['s', { id: 'note' }]);
	expect(stream.send.mock.calls[1]).toEqual(['connect', { id: expect.any(String), channel: 'main', params: {}, pong: true }]);
	expect(trigger).not.toHaveBeenCalled();
	expect(stream.listenerCount('connected')).toBe(0);
	expect(stream.listenerCount('_disconnected_')).toBe(0);
});
