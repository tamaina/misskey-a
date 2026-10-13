/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { Queue, Worker, UnrecoverableError } from 'bullmq';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import type { UserWebhookPayload } from '@features/integrations/backend/services/UserWebhookService.js';
import type { MiWebhook } from '@features/integrations/backend/models/Webhook.js';
vi.mock('@features/federation/backend/services/ApRequestService.js', () => ({ ApRequestCreator: class {} }));
const socket = process.env.MISSKEY_OAUTH_REDIS_SOCKET;
describe.skipIf(!socket)('task-owned antenna Redis queue fixture', () => {
	it('admits one job across independent producers, workers and a producer restart', async () => {
		if (!socket?.includes('/misskey-oauth-')) throw new Error('Task-owned synthetic socket required');
		const connection = { path: socket, maxRetriesPerRequest: null };
		const name = `antenna-synthetic-${randomUUID()}`;
		const first = new Queue(name, { connection }); const second = new Queue(name, { connection });
		const producer = (queue: Queue) => Object.assign(Object.create(QueueService.prototype), { mcpAntennaDeliverQueue: queue }) as QueueService;
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
	it('retains antenna completed and failed identities across mixed legacy cleanup bursts', async () => {
		if (!socket?.includes('/misskey-oauth-')) throw new Error('Task-owned synthetic socket required');
		const connection = { path: socket, maxRetriesPerRequest: null }; const suffix = randomUUID();
		const legacyQueue = new Queue(`legacy-${suffix}`, { connection }); const antennaQueue = new Queue(`antenna-${suffix}`, { connection });
		const producer = Object.assign(Object.create(QueueService.prototype), { userWebhookDeliverQueue: legacyQueue, mcpAntennaDeliverQueue: antennaQueue }) as QueueService;
		const antenna = { id: 'synthetic-sub', userId: 'synthetic-owner', mode: 'mcp', active: true, mcpAntennaId: 'antenna', mcpGeneration: randomUUID(), mcpExpiresAt: new Date(Date.now() + 60000) } as MiWebhook;
		const process = async (job: { data: { noteId?: string }; name: string }) => {
			if (job.data.noteId === 'failed-note' || job.name === 'legacy-failed') throw new UnrecoverableError('Synthetic failure');
			return 'Synthetic success';
		};
		const workers = [new Worker(legacyQueue.name, process, { connection, concurrency: 1 }), new Worker(antennaQueue.name, process, { connection, concurrency: 1 })];
		try {
			const completed = (await producer.antennaWebhookDeliver(antenna, 'antenna', 'completed-note', 1000))!;
			const failed = (await producer.antennaWebhookDeliver(antenna, 'antenna', 'failed-note', 1000))!;
			await vi.waitFor(async () => { expect(await completed.getState()).toBe('completed'); expect(await failed.getState()).toBe('failed'); }, { timeout: 5000 });
			const content = { user: { id: 'synthetic-author' } } as UserWebhookPayload<'follow'>;
			const legacy = { id: 'legacy-completed', userId: 'synthetic-owner', mode: 'legacy', active: true, url: 'https://callback.example', secret: '' } as MiWebhook;
			const burst = await Promise.all(Array.from({ length: 132 }, (_, i) => producer.userWebhookDeliver({ ...legacy, id: i < 31 ? 'legacy-completed' : 'legacy-failed' }, 'follow', content)));
			await vi.waitFor(async () => {
				const states = await Promise.all(burst.map(job => job!.getState()));
				expect(states.every(state => state === 'completed' || state === 'failed' || state === 'unknown')).toBe(true);
			}, { timeout: 5000 });
			expect(await legacyQueue.getCompletedCount()).toBe(30); expect(await legacyQueue.getFailedCount()).toBe(100);
			expect(await completed.getState()).toBe('completed'); expect(await failed.getState()).toBe('failed');
			const delayed = Object.assign(Object.create(QueueService.prototype), { userWebhookDeliverQueue: legacyQueue, mcpAntennaDeliverQueue: antennaQueue }) as QueueService;
			expect((await delayed.antennaWebhookDeliver(antenna, 'antenna', 'completed-note', 1000))?.id).toBe(completed.id);
			expect((await delayed.antennaWebhookDeliver(antenna, 'antenna', 'failed-note', 1000))?.id).toBe(failed.id);
			expect(await antennaQueue.getWaitingCount()).toBe(0); expect(await antennaQueue.getCompletedCount()).toBe(1); expect(await antennaQueue.getFailedCount()).toBe(1);
		} finally { await Promise.all(workers.map(worker => worker.close())); await Promise.all([legacyQueue.obliterate({ force: true }), antennaQueue.obliterate({ force: true })]); await Promise.all([legacyQueue.close(), antennaQueue.close()]); }
	}, 10000);
});
