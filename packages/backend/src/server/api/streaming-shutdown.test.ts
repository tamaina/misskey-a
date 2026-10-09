/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EventEmitter, once } from 'node:events';
import { createServer } from 'node:http';
import { WebSocket } from 'ws';
import { expect, test, vi } from 'vitest';
import { StreamingApiServerService } from '@features/api/backend/transport/StreamingApiServerService.js';

test('detach waits for authentication and prevents a late upgrade', async () => {
	let authenticate!: (value: [null, null]) => void;
	const auth = new Promise<[null, null]>(resolve => { authenticate = resolve; });
	const redis = new EventEmitter(); const server = new EventEmitter();
	const moduleRef = { create: vi.fn(), registerRequestByContextId: vi.fn() };
	const service = new StreamingApiServerService(redis as never, moduleRef as never, { authenticate: () => auth } as never, {} as never);
	service.attach(server as never);
	const socket = { destroy: vi.fn(), write: vi.fn() };
	server.emit('upgrade', { url: '/streaming', headers: {} }, socket, Buffer.alloc(0));
	let done = false; const stopped = service.detach().then(() => { done = true; });
	await Promise.resolve(); expect(done).toBe(false); expect(server.listenerCount('upgrade')).toBe(0);
	authenticate([null, null]); await stopped;
	expect(moduleRef.create).not.toHaveBeenCalled(); expect(socket.destroy).toHaveBeenCalledOnce();
	expect(redis.listenerCount('message')).toBe(0);
});
test('detach disposes a stream whose initialization completes after shutdown starts', async () => {
	let initialized!: () => void; let started!: () => void;
	const gate = new Promise<void>(resolve => { initialized = resolve; });
	const reached = new Promise<void>(resolve => { started = resolve; });
	const stream = { init: () => { started(); return gate; }, dispose: vi.fn() };
	const moduleRef = { create: async () => stream, registerRequestByContextId: vi.fn() };
	const redis = new EventEmitter(); const server = new EventEmitter();
	const service = new StreamingApiServerService(redis as never, moduleRef as never, { authenticate: async () => [null, null] } as never, {} as never);
	service.attach(server as never); const socket = { destroy: vi.fn(), write: vi.fn() };
	server.emit('upgrade', { url: '/streaming', headers: {} }, socket, Buffer.alloc(0));
	await reached; const stopped = service.detach(); initialized(); await stopped;
	expect(stream.dispose).toHaveBeenCalledOnce(); expect(socket.destroy).toHaveBeenCalledOnce();
});
test('detach closes an established WebSocket and removes the Redis listener', async () => {
	const redis = new EventEmitter(); const server = createServer();
	const stream = { init: async () => {}, listen: async () => {}, dispose: vi.fn() };
	const moduleRef = { create: async () => stream, registerRequestByContextId: vi.fn() };
	const service = new StreamingApiServerService(redis as never, moduleRef as never, { authenticate: async () => [null, null] } as never, {} as never);
	service.attach(server);
	await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
	const address = server.address(); if (!address || typeof address === 'string') throw new Error('Missing test port');
	const client = new WebSocket(`ws://127.0.0.1:${address.port}/streaming`);
	try {
		await once(client, 'open'); const closed = once(client, 'close');
		const stopping = service.detach(); expect(service.detach()).toBe(stopping);
		const [code] = await closed; expect(code).toBe(1001); await stopping;
		expect(stream.dispose).toHaveBeenCalledOnce(); expect(redis.listenerCount('message')).toBe(0);
	} finally {
		client.terminate(); await service.detach();
		await new Promise<void>(resolve => server.close(() => resolve()));
	}
});
