/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { EventEmitter } from 'node:events';
import { expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { McpStreamSubscriptionService } from '../../backend/McpStreamSubscriptionService.js';
import type { WebhooksRepository, MiWebhook } from '@features/persistence/backend/repositories/models.js';
import type { McpStreamAccessService } from '../../backend/McpStreamAccessService.js';
import type { QueueService } from '@features/runtime/backend/services/QueueService.js';
import type * as Redis from 'ioredis';
vi.mock('@features/runtime/backend/services/QueueService.js', () => ({ QueueService: class {} }));

const publication = (id = 'occurrence') => JSON.stringify({ occurrenceId: id, createdAt: Date.now(), channel: 'mainStream:owner', message: { type: 'signin', body: { id: 'signin', headers: { authorization: 'PRIVATE_SYNTHETIC' }, ip: 'PRIVATE_SYNTHETIC', success: true } } });

function fixture() {
	const redis = new EventEmitter(); const rows = mockDeep<WebhooksRepository>(); const access = mockDeep<McpStreamAccessService>(); const queue = mockDeep<QueueService>();
	const row = { id: 'subscription', userId: 'owner', mode: 'mcp', active: true, mcpGeneration: 'generation', mcpStream: { channel: 'main', params: {} } } as MiWebhook;
	rows.find.mockResolvedValue([row]); access.authorize.mockResolvedValue({ webhook: row, frames: [] }); queue.streamWebhookDeliver.mockResolvedValue('queued');
	const create = () => new McpStreamSubscriptionService(redis as unknown as Redis.Redis, rows, access, queue);
	return { redis, rows, access, queue, row, create };
}

it('restores future observation from persisted rows after shutdown/recreation, and shares source occurrence across producers', async () => {
	const f = fixture(); const first = f.create(); first.onApplicationBootstrap(); first.onApplicationBootstrap(); expect(f.redis.listenerCount('message')).toBe(1);
	f.redis.emit('message', 'synthetic', publication()); await first.onApplicationShutdown();
	// Shutdown suppresses buffered work; fresh bootstrap observes persisted subscriptions.
	f.queue.streamWebhookDeliver.mockClear(); const restored = f.create(); const second = f.create(); restored.onApplicationBootstrap(); second.onApplicationBootstrap();
	f.redis.emit('message', 'synthetic', publication('after-restart'));
	await vi.waitFor(() => expect(f.queue.streamWebhookDeliver).toHaveBeenCalledTimes(2));
	const sources = f.queue.streamWebhookDeliver.mock.calls.map(([, source]) => source);
	expect(sources[0]).toEqual(sources[1]); expect(sources[0].id).toBe('after-restart'); expect(JSON.stringify(sources)).not.toContain('PRIVATE_SYNTHETIC');
	await Promise.all([restored.onApplicationShutdown(), second.onApplicationShutdown()]); expect(f.redis.listenerCount('message')).toBe(0);
});
it('isolates a failing subscription, filters non-native/legacy publishers and bounds ingress', async () => {
	const f = fixture(); const service = f.create(); const other = { ...f.row, id: 'other' };
	f.rows.find.mockResolvedValue([f.row, other]); f.access.authorize.mockRejectedValueOnce(new Error('Synthetic missing note')).mockResolvedValue({ webhook: other, frames: [] });
	const log = vi.spyOn(console, 'error').mockImplementation(() => {});
	try {
		await service.receive(publication()); expect(f.queue.streamWebhookDeliver).toHaveBeenCalledOnce();
		f.rows.find.mockClear();
		for (const raw of ['invalid', '{}', JSON.stringify({ channel: 'mainStream:owner', message: { type: 'signin', body: { id: 'id' } } }), JSON.stringify({ occurrenceId: 'source', createdAt: Date.now(), channel: 'internal', message: { type: 'token', body: {} } })]) await service.receive(raw);
		expect(f.rows.find).not.toHaveBeenCalled();
		let release!: () => void; const delayed = new Promise<void>(resolve => { release = resolve; });
		f.rows.find.mockImplementation(async () => { await delayed; return []; }); service.onApplicationBootstrap();
		for (let i = 0; i < 40; i++) f.redis.emit('message', 'synthetic', publication(`bounded-${i}`));
		expect(service.dropped).toBe(9); const shutdown = service.onApplicationShutdown(); release(); await shutdown;
		expect(f.redis.listenerCount('message')).toBe(0);
	} finally { log.mockRestore(); await service.onApplicationShutdown(); }
});

it('drains pending native authorization without enqueueing after shutdown', async () => {
	const f = fixture(); const service = f.create(); let entered!: () => void; let release!: () => void;
	const reached = new Promise<void>(resolve => { entered = resolve; }); const delayed = new Promise<void>(resolve => { release = resolve; });
	f.access.authorize.mockImplementation(async () => { entered(); await delayed; return { webhook: f.row, frames: [] }; });
	service.onApplicationBootstrap(); f.redis.emit('message', 'synthetic', publication());
	await reached; const shutdown = service.onApplicationShutdown(); release(); await shutdown;
	expect(f.queue.streamWebhookDeliver).not.toHaveBeenCalled(); expect(f.redis.listenerCount('message')).toBe(0);
});
