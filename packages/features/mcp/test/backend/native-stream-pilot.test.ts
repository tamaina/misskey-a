/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { EventEmitter } from 'node:events';
import { expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { Connection } from '@features/api/backend/transport/stream/Connection.js';
import { MainChannel } from '@features/api/backend/transport/stream/channels/main.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { openNativeStreamPilot } from '../../backend/native-stream-pilot.js';
import type { ModuleRef } from '@nestjs/core';
import type { ConnectionRequest } from '@features/api/backend/transport/stream/Connection.js';
import type { ChannelRequest } from '@features/api/backend/transport/stream/channel.js';
import type { AuthenticateService } from '@features/auth/backend/transport/AuthenticateService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiAccessToken } from '@features/auth/backend/models/AccessToken.js';
import type { StreamEventEmitter } from '@features/runtime/backend/services/GlobalEventService.js';
import type { Packed } from '@features/index/backend/packed.schema.js';

function fixture() {
	const actor = { id: 'owner', host: null, isSuspended: false } as MiLocalUser;
	const token = { id: 'synthetic', permission: ['access:mcp', 'read:account'] } as MiAccessToken;
	const authenticate = mockDeep<AuthenticateService>(); authenticate.authenticate.mockResolvedValue([actor, token]);
	const cache = mockDeep<CacheService>(); cache.userProfileCache.fetch.mockResolvedValue({ mutedInstances: [] } as never);
	cache.userFollowingsCache.fetch.mockResolvedValue({}); cache.userMutingsCache.fetch.mockResolvedValue(new Set());
	cache.userBlockedCache.fetch.mockResolvedValue(new Set()); cache.renoteMutingsCache.fetch.mockResolvedValue(new Set());
	const notes = mockDeep<NoteEntityService>();
	const moduleRef = mockDeep<ModuleRef>(); const requests = new Map<object, unknown>(); const connections: Connection[] = [];
	moduleRef.registerRequestByContextId.mockImplementation((request, context) => { requests.set(context, request); });
	moduleRef.create.mockImplementation(async (target, context) => {
		if (target === Connection) {
			const connection = new Connection(moduleRef, mockDeep(), cache,
				{ userFollowingChannelsCache: { fetch: async () => new Set() } } as never,
				{ mutingChannelsCache: { fetch: async () => new Set() } } as never, mockDeep(), requests.get(context!) as ConnectionRequest);
			connections.push(connection); return connection as never;
		}
		if (target !== MainChannel) throw new Error('Unexpected channel');
		return new MainChannel(requests.get(context!) as ChannelRequest, notes) as never;
	});
	const subscriber = new EventEmitter() as StreamEventEmitter; const output = vi.fn();
	const open = (options: { broadcast?: boolean; signal?: AbortSignal } = {}) => openNativeStreamPilot({ authenticateService: authenticate, moduleRef, subscriber }, { credential: 'SYNTHETIC', ...options }, output);
	const emitFollow = () => subscriber.emit('mainStream:owner', { type: 'follow', body: { id: 'followed', username: 'SYNTHETIC' } } as never);
	return { actor, token, authenticate, cache, notes, moduleRef, connections, subscriber, output, open, emitFollow };
}

it.each(['follow', 'mention', 'specified', 'followers', 'muted', 'blocked', 'instance', 'notification', 'mutedNotification', 'hidden'] as const)('matches native WebSocket main output for %s', async scenario => {
	const f = fixture();
	const note = { id: 'note', userId: 'author', user: { id: 'author', host: null }, visibility: 'public', text: 'SYNTHETIC' } as Packed<'Note'>;
	if (scenario === 'specified') Object.assign(note, { visibility: 'specified', visibleUserIds: ['other'] });
	if (scenario === 'followers') note.visibility = 'followers';
	if (scenario === 'muted' || scenario === 'mutedNotification') f.cache.userMutingsCache.fetch.mockResolvedValue(new Set(['author']));
	if (scenario === 'blocked') f.cache.userBlockedCache.fetch.mockResolvedValue(new Set(['author']));
	if (scenario === 'instance') { note.user.host = 'muted.example'; f.cache.userProfileCache.fetch.mockResolvedValue({ mutedInstances: ['muted.example'] } as never); }
	if (scenario === 'hidden') { note.isHidden = true; f.notes.pack.mockResolvedValue({ ...note, isHidden: false, text: 'SYNTHETIC_REPACKED' }); }
	const pilot = await f.open();
	const context = {}; f.moduleRef.registerRequestByContextId({ user: f.actor, token: f.token }, context as never);
	const ws = await f.moduleRef.create(Connection, context as never) as Connection;
	const wire = Object.assign(new EventEmitter(), { readyState: 1, send: vi.fn() });
	await ws.init(); await ws.listen(f.subscriber, wire as never);
	try {
		expect(await ws.connectChannel('main-pilot', {}, 'main')).toBe(true);
		const event = scenario === 'follow' ? { type: 'follow', body: { id: 'followed' } }
			: scenario === 'notification' || scenario === 'mutedNotification' ? { type: 'notification', body: { id: 'notification', userId: 'author', user: note.user } }
				: { type: 'mention', body: note };
		// Independent native listeners may repack/mutate their own event object.
		f.subscriber.emit('mainStream:owner', structuredClone(event) as never);
		await new Promise(resolve => setTimeout(resolve, 0));
		expect(f.output.mock.calls.map(([frame]) => frame)).toEqual(wire.send.mock.calls.map(([text]) => JSON.parse(text)));
		if (['follow', 'mention', 'notification', 'hidden'].includes(scenario)) expect(f.output).toHaveBeenCalledOnce();
		else expect(f.output).not.toHaveBeenCalled();
		if (scenario === 'hidden') expect(JSON.stringify(f.output.mock.calls)).toContain('SYNTHETIC_REPACKED');
	} finally { pilot.close(); ws.dispose(); }
	expect(f.subscriber.listenerCount('mainStream:owner')).toBe(0); expect(f.subscriber.listenerCount('broadcast')).toBe(0);
});

it.each(['credential', 'master', 'mcpScope', 'nativeScope', 'suspended', 'remote', 'moved'] as const)('rejects %s without retaining listeners or timers', async denied => {
	vi.useFakeTimers(); const f = fixture();
	if (denied === 'credential') f.authenticate.authenticate.mockRejectedValue(new Error('Synthetic denial'));
	if (denied === 'master') f.authenticate.authenticate.mockResolvedValue([f.actor, null]);
	if (denied === 'mcpScope') f.token.permission = ['read:account'];
	if (denied === 'nativeScope') f.token.permission = ['access:mcp'];
	if (denied === 'suspended') f.actor.isSuspended = true;
	if (denied === 'remote') Object.assign(f.actor, { host: 'synthetic.example' });
	if (denied === 'moved') f.actor.movedToUri = 'https://synthetic.example/actor';
	try {
		await expect(f.open({ broadcast: true })).rejects.toBeDefined();
		expect(f.subscriber.eventNames()).toEqual([]); expect(vi.getTimerCount()).toBe(0); expect(f.output).not.toHaveBeenCalled();
	} finally { f.connections.forEach(connection => { connection.dispose(); }); vi.useRealTimers(); }
});

it.each([true, false])('only observes selected native routes (broadcast=%s), with no command handler', async broadcast => {
	const f = fixture(); const pilot = await f.open({ broadcast });
	try {
		const announcement = { type: 'announcementCreated', body: { announcement: { id: 'synthetic' } } };
		f.subscriber.emit('broadcast', announcement as never);
		f.subscriber.emit('mainStream:other', { type: 'follow', body: {} } as never);
		f.subscriber.emit('internal', { type: 'token', body: { secret: 'SYNTHETIC_INTERNAL' } } as never);
		f.subscriber.emit('noteStream:note', { type: 'reacted', body: {} } as never);
		f.subscriber.emit('message' as never, JSON.stringify({ type: 'readNotification' }) as never);
		expect(await f.connections[0].connectChannel('drive', {}, 'drive')).toBe(false);
		expect(await f.connections[0].connectChannel('antenna', {}, 'antenna')).toBe(false);
		expect(f.output.mock.calls.map(([frame]) => frame)).toEqual(broadcast ? [announcement] : []);
	} finally { pilot.close(); }
	expect(await pilot.closed).toEqual({ reason: 'closed' }); expect(f.subscriber.eventNames()).toEqual([]);
});

it.each(['sync', 'async'] as const)('closes on %s sink failure and retains the first completion', async mode => {
	const f = fixture(); const failure = new Error('SYNTHETIC_FAILURE');
	f.output.mockImplementation(() => { if (mode === 'sync') throw failure; return Promise.reject(failure); });
	const pilot = await f.open({ broadcast: true }); f.emitFollow();
	expect(await pilot.closed).toEqual({ reason: 'sink_failed', error: failure });
	expect(f.subscriber.eventNames()).toEqual([]); pilot.close(); f.emitFollow(); expect(f.output).toHaveBeenCalledOnce();
	expect(await pilot.closed).toEqual({ reason: 'sink_failed', error: failure });
});

it('bounds pending sinks and closes on overflow', async () => {
	const f = fixture(); let release!: () => void; const delayed = new Promise<void>(resolve => { release = resolve; });
	f.output.mockImplementation(() => delayed); const pilot = await f.open();
	try {
		for (let i = 0; i < 17; i++) f.emitFollow();
		expect(await pilot.closed).toEqual({ reason: 'sink_failed', error: expect.objectContaining({ message: 'Native stream pilot capacity exceeded' }) });
		expect(f.output).toHaveBeenCalledTimes(16); expect(f.subscriber.eventNames()).toEqual([]);
	} finally { release(); pilot.close(); }
});

it('suppresses a pending repack after abort and clears the native refresh timer', async () => {
	vi.useFakeTimers(); const f = fixture(); const abort = new AbortController(); const pilot = await f.open({ broadcast: true, signal: abort.signal });
	let release!: (note: Packed<'Note'>) => void; f.notes.pack.mockImplementation(() => new Promise(resolve => { release = resolve; }));
	try {
		f.subscriber.emit('mainStream:owner', { type: 'mention', body: { id: 'note', userId: 'author', user: { id: 'author' }, visibility: 'public', isHidden: true } } as never);
		expect(vi.getTimerCount()).toBe(1); abort.abort(); release({ id: 'note' } as Packed<'Note'>); await Promise.resolve();
		expect(await pilot.closed).toEqual({ reason: 'closed' }); expect(vi.getTimerCount()).toBe(0);
		expect(f.output).not.toHaveBeenCalled(); expect(f.subscriber.eventNames()).toEqual([]);
	} finally { pilot.close(); vi.useRealTimers(); }
});

it('cleans abort during initialization, including opt-in broadcast listeners', async () => {
	vi.useFakeTimers(); const f = fixture(); const abort = new AbortController();
	let release!: () => void; let entered!: () => void; const reached = new Promise<void>(resolve => { entered = resolve; }); const delayed = new Promise<void>(resolve => { release = resolve; });
	f.cache.userProfileCache.fetch.mockImplementation(async () => { entered(); await delayed; return { mutedInstances: [] } as never; });
	const pending = f.open({ broadcast: true, signal: abort.signal });
	try {
		await reached; abort.abort(); release(); await expect(pending).rejects.toBeDefined();
		expect(f.subscriber.eventNames()).toEqual([]); expect(vi.getTimerCount()).toBe(0); expect(f.output).not.toHaveBeenCalled();
	} finally { release(); f.connections.forEach(connection => { connection.dispose(); }); vi.useRealTimers(); }
});

it('does not emit broadcasts before native channel authorization succeeds', async () => {
	const f = fixture(); f.token.permission = ['access:mcp'];
	let release!: () => void; let entered!: () => void; const reached = new Promise<void>(resolve => { entered = resolve; }); const delayed = new Promise<void>(resolve => { release = resolve; });
	f.cache.userProfileCache.fetch.mockImplementation(async () => { entered(); await delayed; return { mutedInstances: [] } as never; });
	const pending = f.open({ broadcast: true });
	try {
		await reached; f.subscriber.emit('broadcast', { type: 'emojiAdded', body: { emoji: { id: 'synthetic' } } } as never);
		expect(f.output).not.toHaveBeenCalled(); release(); await expect(pending).rejects.toThrow('Stream access denied');
		expect(f.subscriber.eventNames()).toEqual([]);
	} finally { release(); f.connections.forEach(connection => { connection.dispose(); }); }
});

it('handles abort during connection creation before attaching output or fetching caches', async () => {
	vi.useFakeTimers(); const f = fixture(); const abort = new AbortController();
	let release!: () => void; let entered!: () => void; const reached = new Promise<void>(resolve => { entered = resolve; }); const delayed = new Promise<void>(resolve => { release = resolve; });
	const create = f.moduleRef.create.getMockImplementation()!;
	f.moduleRef.create.mockImplementation(async (target, context) => { if (target === Connection) { entered(); await delayed; } return create(target, context); });
	const pending = f.open({ broadcast: true, signal: abort.signal });
	try {
		await reached; abort.abort(); release(); await expect(pending).rejects.toBeDefined();
		expect(f.subscriber.eventNames()).toEqual([]); expect(vi.getTimerCount()).toBe(0); expect(f.cache.userProfileCache.fetch).not.toHaveBeenCalled();
	} finally { release(); f.connections.forEach(connection => { connection.dispose(); }); vi.useRealTimers(); }
});
