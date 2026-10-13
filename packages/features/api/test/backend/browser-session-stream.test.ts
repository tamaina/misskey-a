/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { EventEmitter } from 'node:events';
import { expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { Connection } from '../../backend/transport/stream/Connection.js';
import type { NotificationService } from '@features/notifications/backend/services/NotificationService.js';
import type { BrowserSessionService } from '@features/auth/backend/services/BrowserSessionService.js';
import type { StreamEventEmitter } from '@features/runtime/backend/services/GlobalEventService.js';

function fixture(session = { id: 'session-a', userId: 'owner' }) {
	const sessions = mockDeep<BrowserSessionService>(); sessions.isActive.mockResolvedValue(true);
	const notifications = mockDeep<NotificationService>();
	const moduleRef = mockDeep<import('@nestjs/core').ModuleRef>();
	const connection = new Connection(moduleRef, notifications, mockDeep(), mockDeep(), mockDeep(), mockDeep(), {
		user: { id: 'owner' } as never, token: null, browserSession: session,
	}, sessions);
	const events = new EventEmitter() as StreamEventEmitter;
	const socket = Object.assign(new EventEmitter(), { readyState: 1, send: vi.fn(), close: vi.fn() });
	const attach = () => connection.listen(events, socket as never);
	const revoke = (id: string | null, userId = 'owner') => events.emit('internal', { type: 'browserSessionRevoked', body: { id, userId } } as never);
	return { connection, sessions, events, socket, notifications, attach, revoke, moduleRef };
}

it.each(['session-a', null])('closes only the matching owned session on revocation (%s)', async id => {
	const f = fixture(); await f.attach();
	f.revoke('session-b'); f.revoke('session-a', 'other'); expect(f.socket.close).not.toHaveBeenCalled();
	f.revoke(id); expect(f.socket.close).toHaveBeenCalledWith(1008, 'Session no longer active');
	expect(f.events.listenerCount('internal')).toBe(0); expect(f.events.listenerCount('broadcast')).toBe(0);
	f.connection.sendMessageToWs('synthetic', {}); expect(f.socket.send).not.toHaveBeenCalled();
});

it.each(['inactive', 'database-error'])('rejects inbound and outbound without Redis notification on %s', async failure => {
	const f = fixture(); await f.attach();
	if (failure === 'inactive') f.sessions.isActive.mockResolvedValue(false);
	else f.sessions.isActive.mockRejectedValue(new Error('SYNTHETIC_DB_ERROR'));
	f.socket.emit('message', Buffer.from(JSON.stringify({ type: 'readNotification' })));
	await vi.waitFor(() => { expect(f.socket.close).toHaveBeenCalledOnce(); });
	expect(f.notifications.readAllNotification).not.toHaveBeenCalled();
	f.connection.sendMessageToWs('synthetic', {}); expect(f.socket.send).not.toHaveBeenCalled();
});

it('checks each outbound delivery and suppresses a late successful DB result after revocation', async () => {
	const f = fixture(); await f.attach();
	let release!: (active: boolean) => void;
	f.sessions.isActive.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
	f.connection.sendMessageToWs('synthetic', {}); expect(f.socket.send).not.toHaveBeenCalled();
	f.revoke('session-a'); release(true); await Promise.resolve(); await Promise.resolve();
	expect(f.socket.send).not.toHaveBeenCalled(); expect(f.socket.close).toHaveBeenCalledOnce();
});

it('fails a native output on durable revocation and disposes its listeners', async () => {
	const f = fixture(); const output = { isOpen: () => true, send: vi.fn(), failed: vi.fn() };
	f.connection.attachNativeOutput(f.events, output, { channels: ['main'], broadcast: true });
	f.sessions.isActive.mockResolvedValue(false);
	f.connection.sendMessageToWs('synthetic', {});
	await vi.waitFor(() => { expect(output.failed).toHaveBeenCalledOnce(); });
	expect(output.send).not.toHaveBeenCalled(); expect(f.events.eventNames()).toEqual([]);
});

it('denies session-owner mismatch and missing validity service', async () => {
	const f = fixture({ id: 'session-a', userId: 'other' }); await f.attach();
	expect(f.sessions.isActive).not.toHaveBeenCalled(); expect(f.socket.close).toHaveBeenCalledOnce();
	const connection = new Connection(mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), {
		user: { id: 'owner' } as never, token: null, browserSession: { id: 'session-a', userId: 'owner' },
	});
	expect(await connection.checkBrowserSession()).toBe(false);
});

it('keeps legacy grant and anonymous connections synchronous without session DB checks', async () => {
	const f = fixture(); const connection = new Connection(mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), { user: null, token: null }, f.sessions);
	await connection.listen(f.events, f.socket as never);
	connection.sendMessageToWs('synthetic', {}); expect(f.socket.send).toHaveBeenCalledOnce();
	expect(f.sessions.isActive).not.toHaveBeenCalled(); expect(f.events.listenerCount('internal')).toBe(0);
	connection.dispose();
});

it('cleans a channel listener initialized after the session was revoked', async () => {
	const f = fixture(); await f.attach();
	let release!: () => void; let entered!: () => void;
	const gate = new Promise<void>(resolve => { release = resolve; });
	const reached = new Promise<void>(resolve => { entered = resolve; });
	const listener = vi.fn();
	const channel = {
		id: 'synthetic-channel',
		init: async () => { entered(); await gate; f.events.on('broadcast', listener); return true; },
		dispose: () => f.events.off('broadcast', listener),
	};
	f.moduleRef.create.mockResolvedValue(channel as never);
	vi.spyOn(f.connection, 'getChannelConstructor').mockReturnValue({ requireCredential: false } as never);
	const pending = f.connection.connectChannel('synthetic-channel', {}, 'synthetic');
	await reached; f.revoke('session-a'); release();
	expect(await pending).toBe(false); expect(f.events.eventNames()).toEqual([]);
});

it.each(['inactive', 'database-error'])('checks and blocks a fresh outbound frame on %s', async failure => {
	const f = fixture(); await f.attach();
	if (failure === 'inactive') f.sessions.isActive.mockResolvedValue(false);
	else f.sessions.isActive.mockRejectedValue(new Error('SYNTHETIC_DB_ERROR'));
	f.connection.sendMessageToWs('synthetic', {});
	await vi.waitFor(() => { expect(f.socket.close).toHaveBeenCalledOnce(); });
	expect(f.socket.send).not.toHaveBeenCalled(); expect(f.events.eventNames()).toEqual([]);
});

it('suppresses a queued inbound command when a late validity result follows revocation', async () => {
	const f = fixture(); await f.attach();
	let release!: (active: boolean) => void; let entered!: () => void;
	const reached = new Promise<void>(resolve => { entered = resolve; });
	f.sessions.isActive.mockImplementationOnce(() => { entered(); return new Promise(resolve => { release = resolve; }); });
	f.socket.emit('message', Buffer.from(JSON.stringify({ type: 'readNotification' })));
	await reached; f.revoke('session-a'); release(true);
	await Promise.resolve(); await Promise.resolve();
	expect(f.notifications.readAllNotification).not.toHaveBeenCalled();
});

it('serializes durable checks and preserves frames behind a stalled validation', async () => {
	const f = fixture(); await f.attach(); f.sessions.isActive.mockClear();
	let release!: (active: boolean) => void;
	f.sessions.isActive.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
	for (let index = 0; index < 3; index++) f.connection.sendMessageToWs('synthetic', { index });
	expect(f.sessions.isActive).toHaveBeenCalledOnce(); expect(f.socket.send).not.toHaveBeenCalled();
	release(true);
	await vi.waitFor(() => { expect(f.socket.send).toHaveBeenCalledTimes(3); });
	expect(f.socket.send.mock.calls.map(([frame]) => JSON.parse(frame).body.index)).toEqual([0, 1, 2]);
	expect(f.sessions.isActive).toHaveBeenCalledTimes(3); f.connection.dispose();
});

it.each(['positive', 'error'])('closes once at the frame cap and discards pending output after a late DB %s', async result => {
	const f = fixture(); await f.attach(); f.sessions.isActive.mockClear();
	let release!: (active: boolean) => void; let reject!: (error: Error) => void;
	f.sessions.isActive.mockImplementationOnce(() => new Promise((resolve, fail) => { release = resolve; reject = fail; }));
	for (let index = 0; index < 64; index++) f.connection.sendMessageToWs('synthetic', { index });
	expect(f.sessions.isActive).toHaveBeenCalledOnce(); expect(f.socket.close).not.toHaveBeenCalled();
	f.connection.sendMessageToWs('overflow', {}); f.connection.sendMessageToWs('overflow-again', {});
	expect(f.socket.close).toHaveBeenCalledWith(1008, 'Session output capacity exceeded');
	expect(f.socket.close).toHaveBeenCalledOnce(); expect(f.events.eventNames()).toEqual([]);
	if (result === 'positive') release(true); else reject(new Error('SYNTHETIC_DB_ERROR'));
	await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
	expect(f.socket.send).not.toHaveBeenCalled(); expect(f.socket.close).toHaveBeenCalledOnce(); expect(f.sessions.isActive).toHaveBeenCalledOnce();
});

it.each(['single-large', 'combined'])('enforces the UTF-8 byte budget on %s frames', async mode => {
	const f = fixture(); await f.attach(); f.sessions.isActive.mockClear();
	let release!: (active: boolean) => void;
	f.sessions.isActive.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
	if (mode === 'single-large') {
		f.connection.sendMessageToWs('synthetic', { text: 'あ'.repeat(400000) });
		expect(f.sessions.isActive).not.toHaveBeenCalled();
	} else {
		f.connection.sendMessageToWs('synthetic', { text: 'あ'.repeat(200000) });
		f.connection.sendMessageToWs('synthetic', { text: 'あ'.repeat(200000) });
		expect(f.sessions.isActive).toHaveBeenCalledOnce(); release(true);
	}
	await Promise.resolve(); await Promise.resolve();
	expect(f.socket.close).toHaveBeenCalledWith(1008, 'Session output capacity exceeded');
	expect(f.socket.close).toHaveBeenCalledOnce(); expect(f.socket.send).not.toHaveBeenCalled(); expect(f.events.eventNames()).toEqual([]);
});

it('drops the entire queue and byte accounting on ordinary disposal before a late positive validation', async () => {
	const f = fixture(); await f.attach(); f.sessions.isActive.mockClear();
	let release!: (active: boolean) => void;
	f.sessions.isActive.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
	for (let index = 0; index < 3; index++) f.connection.sendMessageToWs('synthetic', { index });
	f.connection.dispose();
	// Inspect owned queue state to prove disposal releases payloads before DB returns.
	expect(Reflect.get(f.connection, 'browserSessionOutputs')).toEqual([]);
	expect(Reflect.get(f.connection, 'browserSessionOutputBytes')).toBe(0);
	release(true); await Promise.resolve(); await Promise.resolve();
	expect(f.socket.send).not.toHaveBeenCalled(); expect(f.sessions.isActive).toHaveBeenCalledOnce();
});

it('waits for a native sink before validating the next browser-session frame', async () => {
	const f = fixture(); let release!: () => void;
	const sinkPending = new Promise<void>(resolve => { release = resolve; });
	const output = { isOpen: () => true, send: vi.fn().mockImplementationOnce(() => sinkPending), failed: vi.fn() };
	f.connection.attachNativeOutput(f.events, output, { channels: ['main'] });
	f.connection.sendMessageToWs('synthetic', { index: 0 }); f.connection.sendMessageToWs('synthetic', { index: 1 });
	await vi.waitFor(() => { expect(output.send).toHaveBeenCalledOnce(); });
	expect(f.sessions.isActive).toHaveBeenCalledOnce();
	release(); await vi.waitFor(() => { expect(output.send).toHaveBeenCalledTimes(2); });
	expect(f.sessions.isActive).toHaveBeenCalledTimes(2);
	expect(output.send.mock.calls.map(([frame]) => frame.body.index)).toEqual([0, 1]); f.connection.dispose();
});

it('reports capacity rather than session revocation to a native sink', () => {
	const f = fixture(); const output = { isOpen: () => true, send: vi.fn(), failed: vi.fn() };
	f.connection.attachNativeOutput(f.events, output, { channels: ['main'] });
	f.connection.sendMessageToWs('synthetic', { text: 'あ'.repeat(400000) });
	expect(output.failed).toHaveBeenCalledWith(expect.objectContaining({ message: 'Session output capacity exceeded' }));
	expect(output.failed).toHaveBeenCalledOnce(); expect(output.send).not.toHaveBeenCalled();
	expect(f.sessions.isActive).not.toHaveBeenCalled(); expect(f.events.eventNames()).toEqual([]);
});

it.each(['positive', 'error'])('bounds browser input under a stalled DB and suppresses a late %s', async result => {
	const f = fixture(); await f.attach(); f.sessions.isActive.mockClear();
	let release!: (active: boolean) => void; let reject!: (error: Error) => void;
	f.sessions.isActive.mockImplementationOnce(() => new Promise((resolve, fail) => { release = resolve; reject = fail; }));
	const frame = Buffer.from(JSON.stringify({ type: 'readNotification' }));
	for (let index = 0; index < 64; index++) f.socket.emit('message', frame);
	expect(f.sessions.isActive).toHaveBeenCalledOnce(); expect(f.notifications.readAllNotification).not.toHaveBeenCalled();
	expect(Reflect.get(f.connection, 'browserSessionInputs')).toHaveLength(64);
	expect(f.socket.close).not.toHaveBeenCalled();
	f.socket.emit('message', frame); f.socket.emit('message', frame);
	expect(f.socket.close).toHaveBeenCalledWith(1008, 'Session input capacity exceeded'); expect(f.socket.close).toHaveBeenCalledOnce();
	expect(Reflect.get(f.connection, 'browserSessionInputs')).toEqual([]); expect(Reflect.get(f.connection, 'browserSessionInputBytes')).toBe(0);
	if (result === 'positive') release(true); else reject(new Error('SYNTHETIC_DB_ERROR'));
	await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
	expect(f.notifications.readAllNotification).not.toHaveBeenCalled(); expect(f.sessions.isActive).toHaveBeenCalledOnce(); expect(f.socket.close).toHaveBeenCalledOnce();
});

it.each(['buffer', 'fragments', 'array-buffer'])('rejects an oversized raw %s before allocating a queued copy', async kind => {
	const f = fixture(); await f.attach(); f.sessions.isActive.mockClear();
	const data = kind === 'buffer' ? Buffer.alloc(1024 * 1024 + 1)
		: kind === 'fragments' ? [Buffer.alloc(600000), Buffer.alloc(600000)] : new ArrayBuffer(1024 * 1024 + 1);
	const copy = vi.spyOn(Buffer, 'from'); const concat = vi.spyOn(Buffer, 'concat');
	try {
		f.socket.emit('message', data);
		expect(copy).not.toHaveBeenCalled(); expect(concat).not.toHaveBeenCalled();
	} finally { copy.mockRestore(); concat.mockRestore(); }
	expect(f.socket.close).toHaveBeenCalledWith(1008, 'Session input capacity exceeded'); expect(f.socket.close).toHaveBeenCalledOnce();
	expect(f.sessions.isActive).not.toHaveBeenCalled(); expect(Reflect.get(f.connection, 'browserSessionInputs')).toEqual([]);
});

it('counts combined raw bytes while validation is pending', async () => {
	const f = fixture(); await f.attach(); f.sessions.isActive.mockClear();
	let release!: (active: boolean) => void;
	f.sessions.isActive.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
	f.socket.emit('message', [Buffer.alloc(300000), Buffer.alloc(300000)]);
	expect(Reflect.get(f.connection, 'browserSessionInputBytes')).toBe(600000);
	f.socket.emit('message', new ArrayBuffer(600000));
	expect(f.socket.close).toHaveBeenCalledWith(1008, 'Session input capacity exceeded'); expect(f.socket.close).toHaveBeenCalledOnce();
	expect(Reflect.get(f.connection, 'browserSessionInputs')).toEqual([]); expect(Reflect.get(f.connection, 'browserSessionInputBytes')).toBe(0);
	release(true); await Promise.resolve(); await Promise.resolve(); expect(f.notifications.readAllNotification).not.toHaveBeenCalled();
});

it('releases pending raw frames on ordinary disposal before a late DB result', async () => {
	const f = fixture(); await f.attach(); f.sessions.isActive.mockClear();
	let release!: (active: boolean) => void;
	f.sessions.isActive.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
	for (let index = 0; index < 3; index++) f.socket.emit('message', Buffer.from(JSON.stringify({ type: 'readNotification' })));
	f.connection.dispose();
	expect(Reflect.get(f.connection, 'browserSessionInputs')).toEqual([]); expect(Reflect.get(f.connection, 'browserSessionInputBytes')).toBe(0);
	release(true); await Promise.resolve(); await Promise.resolve();
	expect(f.notifications.readAllNotification).not.toHaveBeenCalled(); expect(f.sessions.isActive).toHaveBeenCalledOnce();
});

it('preserves input order and awaits connect before dispatching the next copied raw frame', async () => {
	const f = fixture(); await f.attach(); f.sessions.isActive.mockClear();
	let release!: () => void; let entered!: () => void;
	const gate = new Promise<void>(resolve => { release = resolve; }); const reached = new Promise<void>(resolve => { entered = resolve; });
	const connect = vi.spyOn(f.connection, 'connectChannel').mockImplementation(async () => { entered(); await gate; return true; });
	f.socket.emit('message', Buffer.from(JSON.stringify({ type: 'connect', body: { id: 'channel-a', channel: 'main', params: {} } })));
	const original = Buffer.from(JSON.stringify({ type: 'readNotification' }));
	const raw = original.buffer.slice(original.byteOffset, original.byteOffset + original.byteLength);
	f.socket.emit('message', raw); new Uint8Array(raw).fill(0);
	await reached; expect(f.notifications.readAllNotification).not.toHaveBeenCalled(); expect(f.sessions.isActive).toHaveBeenCalledOnce();
	release(); await vi.waitFor(() => { expect(f.notifications.readAllNotification).toHaveBeenCalledOnce(); });
	expect(connect).toHaveBeenCalledWith('channel-a', {}, 'main', undefined); expect(f.sessions.isActive).toHaveBeenCalledTimes(2);
	f.connection.dispose();
});

it('bounds flooding during channel init and removes a listener installed after overflow', async () => {
	const f = fixture(); await f.attach();
	let release!: () => void; let entered!: () => void;
	const gate = new Promise<void>(resolve => { release = resolve; }); const reached = new Promise<void>(resolve => { entered = resolve; });
	const listener = vi.fn();
	f.moduleRef.create.mockResolvedValue({
		id: 'pending-channel',
		init: async () => { entered(); await gate; f.events.on('broadcast', listener); return true; },
		dispose: () => f.events.off('broadcast', listener),
	} as never);
	vi.spyOn(f.connection, 'getChannelConstructor').mockReturnValue({ requireCredential: false } as never);
	f.socket.emit('message', Buffer.from(JSON.stringify({ type: 'connect', body: { id: 'pending-channel', channel: 'synthetic', params: {} } })));
	await reached;
	const frame = Buffer.from(JSON.stringify({ type: 'readNotification' }));
	for (let index = 0; index < 63; index++) f.socket.emit('message', frame);
	expect(Reflect.get(f.connection, 'browserSessionInputs')).toHaveLength(64); expect(f.socket.close).not.toHaveBeenCalled();
	f.socket.emit('message', frame);
	expect(f.socket.close).toHaveBeenCalledWith(1008, 'Session input capacity exceeded'); expect(f.socket.close).toHaveBeenCalledOnce();
	expect(Reflect.get(f.connection, 'browserSessionInputs')).toEqual([]); expect(Reflect.get(f.connection, 'browserSessionInputBytes')).toBe(0);
	release(); await vi.waitFor(() => { expect(Reflect.get(f.connection, 'drainingBrowserSessionInputs')).toBe(false); });
	expect(f.events.eventNames()).toEqual([]);
	expect(f.notifications.readAllNotification).not.toHaveBeenCalled(); expect(f.socket.close).toHaveBeenCalledOnce();
});
