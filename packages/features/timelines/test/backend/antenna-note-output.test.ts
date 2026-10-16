/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { DI } from '@/di-symbols.js';
import { NotificationService } from '@features/notifications/backend/services/NotificationService.js';
import { ChannelFollowingService } from '@features/channels/backend/services/ChannelFollowingService.js';
import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
import { EventEmitter } from 'node:events';
import { expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { Connection } from '@features/api/backend/transport/stream/Connection.js';
import { AntennaChannel } from '../../backend/stream/antenna.js';
import { AntennaNoteAccessService } from '../../backend/services/AntennaNoteAccessService.js';
import { openAntennaNotePilot } from '../../backend/stream/antenna-note-pilot.js';
import type { BrowserSessionService } from '@features/auth/backend/services/BrowserSessionService.js';
import type { ConnectionRequest } from '@features/api/backend/transport/stream/Connection.js';
import type { ChannelRequest } from '@features/api/backend/transport/stream/channel.js';
import type { AntennasRepository } from '@features/persistence/backend/repositories/models.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { NoteStreamingHidingService } from '@features/api/backend/transport/stream/NoteStreamingHidingService.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import type { ModuleRef } from '@nestjs/core';
import type { StreamEventEmitter } from '@features/runtime/backend/services/GlobalEventService.js';
import type { AuthenticateService } from '@features/auth/backend/transport/AuthenticateService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiAccessToken } from '@features/auth/backend/models/AccessToken.js';
import type { Packed } from '@features/index/backend/packed.schema.js';

function fixture() {
	const actor = { id: 'owner', host: null, isSuspended: false } as MiLocalUser;
	const token = { id: 'synthetic-grant', permission: ['read:account'] } as MiAccessToken;
	const authenticate = mockDeep<AuthenticateService>(); authenticate.authenticate.mockResolvedValue([actor, token]);
	const antennas = mockDeep<AntennasRepository>(); antennas.exists.mockResolvedValue(true);
	const notes = mockDeep<NoteEntityService>(); const hiding = mockDeep<NoteStreamingHidingService>();
	const packed = { id: 'note', userId: 'author', user: { id: 'author', host: null }, visibility: 'public', text: 'SYNTHETIC_PACKED' } as Packed<'Note'>;
	notes.pack.mockResolvedValue(packed); hiding.filter.mockImplementation(async note => ({ ...note, text: 'SYNTHETIC_FILTERED' }));
	const cache = mockDeep<CacheService>(); cache.userProfileCache.fetch.mockResolvedValue({ mutedInstances: [] } as never); cache.userFollowingsCache.fetch.mockResolvedValue({});
	cache.userMutingsCache.fetch.mockResolvedValue(new Set()); cache.userBlockedCache.fetch.mockResolvedValue(new Set()); cache.renoteMutingsCache.fetch.mockResolvedValue(new Set());
	const moduleRef = mockDeep<ModuleRef>(); const requests = new Map<object, unknown>();
	moduleRef.registerRequestByContextId.mockImplementation((request, context) => { requests.set(context, request); });
	const sessions = mockDeep<BrowserSessionService>(); sessions.isActive.mockResolvedValue(true);
	const connections: Connection[] = []; const mutingChannels = new Set<string>();
	moduleRef.create.mockImplementation(async (target, context) => {
		if (target === Connection) {
			const connection = new Connection(moduleRef, mockDeep(), cache, { userFollowingChannelsCache: { fetch: async () => new Set() } } as never, { mutingChannelsCache: { fetch: async () => mutingChannels } } as never, mockDeep(), requests.get(context!) as ConnectionRequest, sessions);
			connections.push(connection); return connection as never;
		}
		if (target !== AntennaChannel) throw new Error('Unexpected channel');
		return new AntennaChannel(requests.get(context!) as ChannelRequest, antennas, notes, hiding) as never;
	});
	const subscriber = new EventEmitter() as StreamEventEmitter; const output = vi.fn();
	const open = (signal?: AbortSignal) => openAntennaNotePilot({ authenticateService: authenticate, moduleRef, subscriber }, { credential: 'SYNTHETIC_ONLY', antennaId: 'antenna', signal }, output);
	const emit = () => subscriber.emit('antennaStream:antenna', { type: 'note', body: { id: 'note', text: 'RAW_REDIS_SYNTHETIC' } } as never);
	return { actor, token, authenticate, antennas, notes, hiding, packed, cache, moduleRef, subscriber, connections, mutingChannels, output, open, emit, sessions };
}

it.each(['visible', 'specified', 'followers', 'muted', 'blocked', 'instance', 'channel', 'hidden'] as const)('matches WebSocket post-filter antenna output for %s', async scenario => {
	const f = fixture();
	if (scenario === 'specified') Object.assign(f.packed, { visibility: 'specified', visibleUserIds: ['other'] });
	if (scenario === 'followers') f.packed.visibility = 'followers';
	if (scenario === 'muted') f.cache.userMutingsCache.fetch.mockResolvedValue(new Set(['author']));
	if (scenario === 'blocked') f.cache.userBlockedCache.fetch.mockResolvedValue(new Set(['author']));
	if (scenario === 'instance') { f.cache.userProfileCache.fetch.mockResolvedValue({ mutedInstances: ['muted.example'] } as never); f.packed.user.host = 'muted.example'; }
	if (scenario === 'channel') f.packed.channelId = 'muted-channel';
	if (scenario === 'hidden') f.hiding.filter.mockResolvedValue(null);
	const pilot = await f.open(); f.connections[0].mutingChannels.add('muted-channel');
	const context = {}; f.moduleRef.registerRequestByContextId({ user: f.actor, token: f.token }, context as never);
	const ws = await f.moduleRef.create(Connection, context as never) as Connection; const wire = Object.assign(new EventEmitter(), { readyState: 1, send: vi.fn() });
	await ws.init(); await ws.listen(f.subscriber, wire as never); ws.mutingChannels.add('muted-channel');
	try {
		expect(await ws.connectChannel('ws-antenna', { antennaId: 'antenna' }, 'antenna')).toBe(true);
		f.emit(); await vi.waitFor(() => { expect(f.notes.pack).toHaveBeenCalledTimes(2); }); await new Promise(resolve => setTimeout(resolve, 0));
		expect(f.output.mock.calls.map(([note]) => note)).toEqual(wire.send.mock.calls.map(([text]) => JSON.parse(text).body.body));
		if (scenario === 'visible') { expect(f.output).toHaveBeenCalledOnce(); expect(f.output.mock.calls[0][0].text).toBe('SYNTHETIC_FILTERED'); expect(JSON.stringify(f.output.mock.calls)).not.toContain('RAW_REDIS_SYNTHETIC'); } else expect(f.output).not.toHaveBeenCalled();
		expect(f.antennas.exists).toHaveBeenCalledWith({ where: { id: 'antenna', userId: 'owner' } });
	} finally { pilot.close(); ws.dispose(); }
	expect(f.subscriber.listenerCount('antennaStream:antenna')).toBe(0);
});
it.each(['credential', 'scope', 'owner', 'suspended'] as const)('rejects %s before consuming antenna events', async denied => {
	const f = fixture();
	if (denied === 'credential') f.authenticate.authenticate.mockRejectedValue(new Error('Synthetic invalid credential'));
	if (denied === 'scope') f.token.permission = [];
	if (denied === 'owner') f.antennas.exists.mockResolvedValue(false);
	if (denied === 'suspended') f.actor.isSuspended = true;
	await expect(f.open()).rejects.toBeDefined(); expect(f.subscriber.listenerCount('antennaStream:antenna')).toBe(0); expect(f.output).not.toHaveBeenCalled();
});
it('only emits antenna notes and suppresses asynchronous output after abort', async () => {
	const f = fixture(); const abort = new AbortController(); const pilot = await f.open(abort.signal);
	try {
		expect(await f.connections[0].connectChannel('other', {}, 'main')).toBe(false);
		f.subscriber.emit('broadcast', { type: 'announcementCreated', body: {} } as never); f.subscriber.emit('antennaStream:antenna', { type: 'control', body: {} } as never); expect(f.output).not.toHaveBeenCalled();
		let release!: () => void; const delayed = new Promise<void>(resolve => { release = resolve; });
		f.notes.pack.mockImplementation(async () => { await delayed; return f.packed; }); f.emit(); abort.abort(); release(); await new Promise(resolve => setTimeout(resolve, 0));
		expect(f.output).not.toHaveBeenCalled(); expect(f.subscriber.listenerCount('antennaStream:antenna')).toBe(0);
	} finally { pilot.close(); }
});
it('cleans a listener installed after abort during the ownership lookup', async () => {
	const f = fixture(); const abort = new AbortController(); let release!: () => void; let entered!: () => void;
	const delayed = new Promise<void>(resolve => { release = resolve; }); const reached = new Promise<void>(resolve => { entered = resolve; });
	f.antennas.exists.mockImplementation(async () => { entered(); await delayed; return true; });
	const pending = f.open(abort.signal); await reached; abort.abort(); release(); await expect(pending).rejects.toBeDefined(); expect(f.subscriber.listenerCount('antennaStream:antenna')).toBe(0);
});

it.each(['sync', 'async'] as const)('closes and reports a %s sink failure without an unhandled event error', async mode => {
	const f = fixture(); const failure = new Error('SYNTHETIC_SINK_FAILURE');
	f.output.mockImplementationOnce(() => { if (mode === 'sync') throw failure; return Promise.reject(failure); });
	const pilot = await f.open();
	try {
		f.emit(); expect(await pilot.closed).toEqual({ reason: 'sink_failed', error: failure });
		expect(f.subscriber.listenerCount('antennaStream:antenna')).toBe(0);
		f.emit(); await new Promise(resolve => setTimeout(resolve, 0)); expect(f.output).toHaveBeenCalledOnce();
		pilot.close(); expect(await pilot.closed).toEqual({ reason: 'sink_failed', error: failure });
	} finally { pilot.close(); }
});

it('fulfills the completion promise on ordinary close', async () => {
	const f = fixture(); const pilot = await f.open(); pilot.close();
	expect(await pilot.closed).toEqual({ reason: 'closed' }); expect(f.subscriber.listenerCount('antennaStream:antenna')).toBe(0);
});

it('does not retain a timer, listener or output after abort during the initial cache fetch', async () => {
	vi.useFakeTimers(); const f = fixture(); const abort = new AbortController(); const reason = new Error('SYNTHETIC_INITIAL_ABORT');
	let entered!: () => void; let release!: () => void;
	const reached = new Promise<void>(resolve => { entered = resolve; }); const delayed = new Promise<void>(resolve => { release = resolve; });
	f.cache.userProfileCache.fetch.mockImplementation(async () => { entered(); await delayed; return { mutedInstances: [] } as never; });
	const pending = f.open(abort.signal).catch(error => error);
	try {
		await reached; abort.abort(reason); release(); expect(await pending).toBe(reason);
		expect(vi.getTimerCount()).toBe(0); expect(f.subscriber.listenerCount('antennaStream:antenna')).toBe(0); expect(f.subscriber.listenerCount('broadcast')).toBe(0);
		await f.connections[0].init(); await vi.advanceTimersByTimeAsync(20000); f.emit();
		expect(f.cache.userProfileCache.fetch).toHaveBeenCalledOnce(); expect(f.output).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
	} finally { release(); await pending; f.connections.forEach(connection => { connection.dispose(); }); vi.useRealTimers(); }
});

it('keeps the first completion result when a delayed reinitialization finishes after abort', async () => {
	vi.useFakeTimers(); const f = fixture(); const abort = new AbortController();
	const pilot = await f.open(abort.signal); let entered!: () => void; let release!: () => void;
	const reached = new Promise<void>(resolve => { entered = resolve; }); const delayed = new Promise<void>(resolve => { release = resolve; });
	f.cache.userProfileCache.fetch.mockImplementation(async () => { entered(); await delayed; return { mutedInstances: [] } as never; });
	const pending = f.connections[0].init();
	try {
		expect(vi.getTimerCount()).toBe(1); await reached; abort.abort(); const first = await pilot.closed;
		expect(first).toEqual({ reason: 'closed' }); expect(vi.getTimerCount()).toBe(0);
		release(); await pending; pilot.close(); expect(await pilot.closed).toBe(first);
		expect(vi.getTimerCount()).toBe(0); expect(f.subscriber.listenerCount('antennaStream:antenna')).toBe(0); f.emit(); expect(f.output).not.toHaveBeenCalled();
	} finally { release(); await pending; pilot.close(); vi.useRealTimers(); }
});

it.each(['visible', 'specified', 'followers', 'muted', 'blocked', 'instance', 'channel', 'hidden'] as const)('applies native queued antenna filtering without retained timers for %s', async scenario => {
	vi.useFakeTimers(); const f = fixture();
	try {
		if (scenario === 'specified') f.notes.pack.mockResolvedValue({ ...f.packed, visibility: 'specified', visibleUserIds: ['other'] });
		if (scenario === 'followers') f.notes.pack.mockResolvedValue({ ...f.packed, visibility: 'followers' });
		if (scenario === 'muted') f.cache.userMutingsCache.fetch.mockResolvedValue(new Set(['author']));
		if (scenario === 'blocked') f.cache.userBlockedCache.fetch.mockResolvedValue(new Set(['author']));
		if (scenario === 'instance') { f.notes.pack.mockResolvedValue({ ...f.packed, user: { ...f.packed.user, host: 'muted.example' } }); f.cache.userProfileCache.fetch.mockResolvedValue({ mutedInstances: ['muted.example'] } as never); }
		if (scenario === 'channel') { f.packed.channelId = 'muted-channel'; f.mutingChannels.add('muted-channel'); }
		if (scenario === 'hidden') f.hiding.filter.mockResolvedValue(null);
		const service = new AntennaNoteAccessService(f.moduleRef);
		expect(await service.isDeliverable(f.actor, f.token, 'antenna', 'note')).toBe(scenario === 'visible');
		expect(vi.getTimerCount()).toBe(0);
		for (const connection of f.connections) expect(connection.subscriber.listenerCount('antennaStream:antenna')).toBe(0);
	} finally { for (const connection of f.connections) connection.dispose(); vi.useRealTimers(); }
});

it('creates the native antenna filter through Nest without a server or socket', async () => {
	const f = fixture();
	f.notes.shouldHideNote.mockResolvedValue(false);
	const module = await Test.createTestingModule({ providers: [
		AntennaNoteAccessService, NoteStreamingHidingService,
		{ provide: NotificationService, useValue: mockDeep<NotificationService>() },
		{ provide: CacheService, useValue: f.cache },
		{ provide: ChannelFollowingService, useValue: { userFollowingChannelsCache: { fetch: async () => new Set() } } },
		{ provide: ChannelMutingService, useValue: { mutingChannelsCache: { fetch: async () => new Set() } } },
		{ provide: NoteEntityService, useValue: f.notes },
		{ provide: DI.meta, useValue: {} }, { provide: DI.antennasRepository, useValue: f.antennas },
	] }).compile();
	try {
		expect(await module.get(AntennaNoteAccessService).isDeliverable(f.actor, f.token, 'antenna', 'note')).toBe(true);
		f.antennas.exists.mockResolvedValue(false);
		expect(await module.get(AntennaNoteAccessService).isDeliverable(f.actor, f.token, 'antenna', 'note')).toBe(false);
		f.antennas.exists.mockResolvedValue(true);
		expect(await module.get(AntennaNoteAccessService).isDeliverable(f.actor, { ...f.token, permission: [] }, 'antenna', 'note')).toBe(false);
	} finally { await module.close(); }
});

it('propagates a first-party browser session and stops antenna output on its revocation', async () => {
	const f = fixture();
	const browserSession = { id: 'session-a', userId: f.actor.id };
	f.authenticate.authenticate.mockResolvedValue([f.actor, null, browserSession]);
	const pilot = await f.open();
	try {
		expect(f.moduleRef.registerRequestByContextId).toHaveBeenCalledWith({ user: f.actor, token: null, browserSession }, expect.anything());
		f.emit(); await vi.waitFor(() => { expect(f.output).toHaveBeenCalledOnce(); }); f.output.mockClear();
		expect(f.sessions.isActive).toHaveBeenCalledWith(browserSession.id, browserSession.userId);
		f.subscriber.emit('internal', { type: 'browserSessionRevoked', body: browserSession } as never);
		expect(await pilot.closed).toEqual({ reason: 'sink_failed', error: expect.objectContaining({ message: 'Session no longer active' }) });
		f.emit(); await new Promise(resolve => setTimeout(resolve, 0));
		expect(f.output).not.toHaveBeenCalled(); expect(f.subscriber.eventNames()).toEqual([]);
	} finally { pilot.close(); }
});
