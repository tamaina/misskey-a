/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { Queue, Worker } from 'bullmq';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import type { MiWebhook } from '@features/integrations/backend/models/Webhook.js';
vi.mock('@features/federation/backend/services/ApRequestService.js', () => ({ ApRequestCreator: class {} }));
const socket = process.env.MISSKEY_OAUTH_REDIS_SOCKET;
describe.skipIf(!socket)('task-owned antenna Redis queue fixture', () => {
	it('admits one job across independent producers, workers and a producer restart', async () => {
		if (!socket?.includes('/misskey-oauth-')) throw new Error('Task-owned synthetic socket required');
		const connection = { path: socket, maxRetriesPerRequest: null };
		const name = `antenna-synthetic-${randomUUID()}`;
		const first = new Queue(name, { connection }); const second = new Queue(name, { connection });
		const producer = (queue: Queue) => Object.assign(Object.create(QueueService.prototype), { userWebhookDeliverQueue: queue }) as QueueService;
		const webhook = { id: 'synthetic-sub', userId: 'synthetic-owner', mode: 'mcp', active: true, mcpAntennaId: 'antenna', mcpGeneration: randomUUID(), mcpExpiresAt: new Date(Date.now() + 60000) } as MiWebhook;
		let processed = 0; const workers: Worker[] = []; let restarted: Queue | undefined;
		try {
			const jobs = await Promise.all(Array.from({ length: 20 }, (_, index) => producer(index % 2 ? first : second).antennaWebhookDeliver(webhook, 'antenna', 'note', 1000)));
			expect(new Set(jobs.map(job => job?.id)).size).toBe(1); expect(await first.getWaitingCount()).toBe(1);
			for (let i = 0; i < 2; i++) workers.push(new Worker(name, async () => { processed++; return 'Synthetic success'; }, { connection, concurrency: 1 }));
			await vi.waitFor(async () => { expect(await first.getCompletedCount()).toBe(1); }, { timeout: 5000 }); expect(processed).toBe(1);
			await Promise.all(workers.map(worker => worker.close())); workers.length = 0; await first.close();
			restarted = new Queue(name, { connection }); await producer(restarted).antennaWebhookDeliver(webhook, 'antenna', 'note', 1000);
			expect(await restarted.getWaitingCount()).toBe(0); expect(await restarted.getCompletedCount()).toBe(1);
			const next = await producer(restarted).antennaWebhookDeliver({ ...webhook, mcpGeneration: randomUUID() }, 'antenna', 'note', 1000);
			expect(next?.id).not.toBe(jobs[0]?.id); expect(await restarted.getWaitingCount()).toBe(1);
			expect(jobs[0]?.data).not.toHaveProperty('secret'); expect(jobs[0]?.data).not.toHaveProperty('content'); expect(jobs[0]?.opts.removeOnComplete).toEqual({ age: 86400 });
		} finally {
			await Promise.all(workers.map(worker => worker.close())); await (restarted ?? second).obliterate({ force: true });
			await Promise.all([first.close(), second.close(), restarted?.close()]);
		}
	}, 10000);
});
