/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { EventEmitter } from 'node:events';
import { expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { AntennaEventSubscriptionService } from '@features/timelines/backend/services/AntennaEventSubscriptionService.js';
import type { WebhooksRepository } from '@features/persistence/backend/repositories/models.js';
import type { QueueService } from '@features/runtime/backend/services/QueueService.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { MiWebhook } from '@features/integrations/backend/models/Webhook.js';
import type * as Redis from 'ioredis';
vi.mock('@features/runtime/backend/services/QueueService.js', () => ({ QueueService: class {} }));
const event = JSON.stringify({ channel: 'antennaStream:antenna', message: { type: 'note', body: { id: 'note', text: 'PRIVATE_SYNTHETIC' } } });
it('attaches once, ignores other channels, drains pending shutdown and suppresses late enqueue', async () => {
	const redis = new EventEmitter(); const rows = mockDeep<WebhooksRepository>(); const queue = mockDeep<QueueService>(); const ids = mockDeep<IdService>();
	ids.parse.mockReturnValue({ date: new Date(1000) });
	const service = new AntennaEventSubscriptionService(redis as unknown as Redis.Redis, rows, queue, ids);
	service.onApplicationBootstrap(); service.onApplicationBootstrap(); expect(redis.listenerCount('message')).toBe(1);
	for (const data of ['invalid', '{}', JSON.stringify({ channel: 'homeTimeline', message: { type: 'note', body: { id: 'note' } } }), JSON.stringify({ channel: 'antennaStream:antenna', message: { type: 'unread', body: {} } })]) await service.receive(data);
	expect(rows.find).not.toHaveBeenCalled();
	let release!: (rows: MiWebhook[]) => void;
	rows.find.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
	redis.emit('message', 'synthetic', event);
	const shutdown = service.onApplicationShutdown(); expect(redis.listenerCount('message')).toBe(0);
	release([{ id: 'synthetic-sub' } as MiWebhook]); await shutdown;
	expect(queue.antennaWebhookDeliver).not.toHaveBeenCalled();
	service.onApplicationBootstrap(); expect(redis.listenerCount('message')).toBe(0);
	await service.receive(event); expect(rows.find).toHaveBeenCalledOnce();
});
