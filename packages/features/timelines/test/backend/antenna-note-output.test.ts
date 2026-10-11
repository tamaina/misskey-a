/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { EventEmitter } from 'node:events';
import { expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { Connection } from '@features/api/backend/transport/stream/Connection.js';
import { AntennaChannel } from '../../backend/stream/antenna.js';
import { openAntennaNotePilot } from '../../backend/stream/antenna-note-pilot.js';
import type { ConnectionRequest } from '@features/api/backend/transport/stream/Connection.js';
import type { ChannelRequest } from '@features/api/backend/transport/stream/channel.js';
import type { AntennasRepository } from '@features/persistence/backend/repositories/models.js';
import type { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import type { NoteStreamingHidingService } from '@features/api/backend/transport/stream/NoteStreamingHidingService.js';
import type { CacheService } from '@features/users/backend/services/CacheService.js';
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
	const connections: Connection[] = [];
	moduleRef.create.mockImplementation(async (target, context) => {
		if (target === Connection) {
			const connection = new Connection(moduleRef, mockDeep(), cache, { userFollowingChannelsCache: { fetch: async () => new Set() } } as never, { mutingChannelsCache: { fetch: async () => new Set() } } as never, mockDeep(), requests.get(context!) as ConnectionRequest);
			connections.push(connection); return connection as never;
		}
		if (target !== AntennaChannel) throw new Error('Unexpected channel');
		return new AntennaChannel(requests.get(context!) as ChannelRequest, antennas, notes, hiding) as never;
	});
	const subscriber = new EventEmitter() as StreamEventEmitter; const output = vi.fn();
	const open = (signal?: AbortSignal) => openAntennaNotePilot({ authenticateService: authenticate, moduleRef, subscriber }, { credential: 'SYNTHETIC_ONLY', antennaId: 'antenna', signal }, output);
	const emit = () => subscriber.emit('antennaStream:antenna', { type: 'note', body: { id: 'note', text: 'RAW_REDIS_SYNTHETIC' } } as never);
	return { actor, token, authenticate, antennas, notes, hiding, packed, cache, moduleRef, subscriber, connections, output, open, emit };
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
