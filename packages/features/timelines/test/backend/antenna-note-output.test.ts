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
import type { BrowserSessionService } from '@features/auth/backend/services/BrowserSessionService.js';
import type { ConnectionRequest } from '@features/api/backend/transport/stream/Connection.js';
import type { ChannelRequest } from '@features/api/backend/transport/stream/channel.js';
import type { AntennasRepository } from '@features/persistence/backend/repositories/models.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { NoteStreamingHidingService } from '@features/api/backend/transport/stream/NoteStreamingHidingService.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import type { ModuleRef } from '@nestjs/core';
import type { StreamEventEmitter } from '@features/runtime/backend/services/GlobalEventService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiAccessToken } from '@features/auth/backend/models/AccessToken.js';
import type { Packed } from '@features/index/backend/packed.schema.js';

type Scenario = 'visible' | 'specified' | 'specified-recipient' | 'followers' | 'followers-following' | 'muted' | 'blocked' | 'renote-muted' | 'instance' | 'channel' | 'hidden';
const scenarios: Scenario[] = ['visible', 'specified', 'specified-recipient', 'followers', 'followers-following', 'muted', 'blocked', 'renote-muted', 'instance', 'channel', 'hidden'];
const deliverable = new Set<Scenario>(['visible', 'specified-recipient', 'followers-following']);

function fixture() {
	const actor = { id: 'owner', host: null, isSuspended: false } as MiLocalUser;
	const token = { id: 'synthetic-grant', permission: ['read:account'] } as MiAccessToken;
	const antennas = mockDeep<AntennasRepository>(); antennas.exists.mockResolvedValue(true);
	const notes = mockDeep<NoteEntityService>(); const hiding = mockDeep<NoteStreamingHidingService>();
	const packed = { id: 'note', userId: 'author', user: { id: 'author', host: null }, visibility: 'public', text: 'SYNTHETIC_PACKED' } as Packed<'Note'>;
	notes.pack.mockResolvedValue(packed); hiding.filter.mockImplementation(async note => ({ ...note, text: 'SYNTHETIC_FILTERED' }));
	notes.withMyRenoteReaction.mockImplementation(async note => ({ ...note, cw: 'SYNTHETIC_MY_RENOTE_REACTION' }));
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
	const subscriber = new EventEmitter() as StreamEventEmitter;
	/** Upstream shape: one viewer-neutral packed note per antenna publication. */
	const emit = (note: Packed<'Note'> = packed) => subscriber.emit('antennaStream:antenna', { type: 'note', body: structuredClone(note) } as never);
	const socket = async (user: MiLocalUser = actor) => {
		const context = {}; moduleRef.registerRequestByContextId({ user, token }, context as never);
		const ws = await moduleRef.create(Connection, context as never) as Connection; const wire = Object.assign(new EventEmitter(), { readyState: 1, send: vi.fn() });
		await ws.init(); await ws.listen(subscriber, wire as never);
		const received = () => wire.send.mock.calls.map(([text]) => JSON.parse(text)).filter(frame => frame.type === 'channel').map(frame => frame.body.body);
		return { ws, wire, received };
	};
	return { actor, token, antennas, notes, hiding, packed, cache, moduleRef, subscriber, connections, mutingChannels, emit, socket };
}

function apply(f: ReturnType<typeof fixture>, scenario: Scenario) {
	if (scenario === 'specified') Object.assign(f.packed, { visibility: 'specified', visibleUserIds: ['other'] });
	if (scenario === 'specified-recipient') Object.assign(f.packed, { visibility: 'specified', visibleUserIds: ['owner'] });
	if (scenario === 'followers') f.packed.visibility = 'followers';
	if (scenario === 'followers-following') { f.packed.visibility = 'followers'; f.cache.userFollowingsCache.fetch.mockResolvedValue({ author: {} } as never); }
	if (scenario === 'muted') f.cache.userMutingsCache.fetch.mockResolvedValue(new Set(['author']));
	if (scenario === 'blocked') f.cache.userBlockedCache.fetch.mockResolvedValue(new Set(['author']));
	if (scenario === 'renote-muted') { Object.assign(f.packed, { text: null, renoteId: 'renoted', renote: { id: 'renoted', userId: 'other', user: { id: 'other', host: null }, visibility: 'public', text: 'SYNTHETIC_RENOTED' } }); f.cache.renoteMutingsCache.fetch.mockResolvedValue(new Set(['author'])); }
	if (scenario === 'instance') { f.cache.userProfileCache.fetch.mockResolvedValue({ mutedInstances: ['muted.example'] } as never); f.packed.user.host = 'muted.example'; }
	if (scenario === 'channel') { f.packed.channelId = 'muted-channel'; f.mutingChannels.add('muted-channel'); }
	if (scenario === 'hidden') f.hiding.filter.mockResolvedValue(null);
}

it.each(scenarios)('filters the pre-packed live antenna note per subscriber without re-packing (%s)', async scenario => {
	const f = fixture(); apply(f, scenario);
	const { ws, received } = await f.socket();
	try {
		expect(await ws.connectChannel('ws-antenna', { antennaId: 'antenna' }, 'antenna')).toBe(true);
		f.emit(); await new Promise(resolve => setTimeout(resolve, 0)); await new Promise(resolve => setTimeout(resolve, 0));
		expect(f.notes.pack).not.toHaveBeenCalled();
		if (deliverable.has(scenario)) {
			expect(received()).toHaveLength(1);
			expect(received()[0]).toMatchObject({ id: 'note', text: 'SYNTHETIC_FILTERED', cw: 'SYNTHETIC_MY_RENOTE_REACTION' });
			expect(f.hiding.filter).toHaveBeenCalledWith(expect.objectContaining({ id: 'note' }), 'owner');
			expect(f.notes.withMyRenoteReaction).toHaveBeenCalledWith(expect.objectContaining({ text: 'SYNTHETIC_FILTERED' }), 'owner');
		} else expect(received()).toEqual([]);
		expect(f.antennas.exists).toHaveBeenCalledWith({ where: { id: 'antenna', userId: 'owner' } });
	} finally { ws.dispose(); }
	expect(f.subscriber.listenerCount('antennaStream:antenna')).toBe(0);
});

it('decides each live subscriber with its own relationships from the same publication', async () => {
	const f = fixture(); f.packed.visibility = 'followers';
	const follower = { id: 'follower', host: null, isSuspended: false } as MiLocalUser;
	f.cache.userFollowingsCache.fetch.mockImplementation(async (id: string) => (id === 'follower' ? { author: {} } : {}) as never);
	const owner = await f.socket(); const other = await f.socket(follower);
	try {
		expect(await owner.ws.connectChannel('a', { antennaId: 'antenna' }, 'antenna')).toBe(true);
		expect(await other.ws.connectChannel('b', { antennaId: 'antenna' }, 'antenna')).toBe(true);
		f.emit(); await new Promise(resolve => setTimeout(resolve, 0)); await new Promise(resolve => setTimeout(resolve, 0));
		expect(owner.received()).toEqual([]);
		expect(other.received()).toHaveLength(1);
		expect(f.hiding.filter).toHaveBeenCalledWith(expect.anything(), 'follower');
		expect(f.notes.pack).not.toHaveBeenCalled();
	} finally { owner.ws.dispose(); other.ws.dispose(); }
});

it('forwards non-note antenna frames unchanged', async () => {
	const f = fixture(); const { ws, received } = await f.socket();
	try {
		expect(await ws.connectChannel('ws-antenna', { antennaId: 'antenna' }, 'antenna')).toBe(true);
		f.subscriber.emit('antennaStream:antenna', { type: 'control', body: { ok: true } } as never); await new Promise(resolve => setTimeout(resolve, 0));
		expect(received()).toEqual([{ ok: true }]); expect(f.notes.pack).not.toHaveBeenCalled();
	} finally { ws.dispose(); }
});

it.each(scenarios)('re-packs and re-checks queued antenna deliveries for the subscriber at delivery time (%s)', async scenario => {
	vi.useFakeTimers(); const f = fixture();
	try {
		apply(f, scenario);
		const service = new AntennaNoteAccessService(f.moduleRef);
		expect(await service.isDeliverable(f.actor, f.token, 'antenna', 'note')).toBe(deliverable.has(scenario));
		expect(f.notes.pack).toHaveBeenCalledWith('note', f.actor, { detail: true });
		expect(vi.getTimerCount()).toBe(0);
		for (const connection of f.connections) expect(connection.subscriber.listenerCount('antennaStream:antenna')).toBe(0);
	} finally { for (const connection of f.connections) connection.dispose(); vi.useRealTimers(); }
});

it('uses the current note and relationships on every delivery attempt (stale-safe retries)', async () => {
	const f = fixture(); const service = new AntennaNoteAccessService(f.moduleRef);
	try {
		expect(await service.isDeliverable(f.actor, f.token, 'antenna', 'note')).toBe(true);
		f.cache.userBlockedCache.fetch.mockResolvedValue(new Set(['author']));
		expect(await service.isDeliverable(f.actor, f.token, 'antenna', 'note')).toBe(false);
		f.cache.userBlockedCache.fetch.mockResolvedValue(new Set());
		f.notes.pack.mockResolvedValue({ ...f.packed, isHidden: true });
		expect(await service.isDeliverable(f.actor, f.token, 'antenna', 'note')).toBe(false);
		f.notes.pack.mockResolvedValue({ ...f.packed, visibility: 'specified', visibleUserIds: ['other'] });
		expect(await service.isDeliverable(f.actor, f.token, 'antenna', 'note')).toBe(false);
		expect(f.notes.pack).toHaveBeenCalledTimes(4);
	} finally { for (const connection of f.connections) connection.dispose(); }
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
