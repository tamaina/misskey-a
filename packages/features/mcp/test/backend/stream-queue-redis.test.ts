/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { Queue, Worker, UnrecoverableError } from 'bullmq';
import { streamQueueBackendFactory, StreamQueueFullError, StreamQueueExpiredError } from '../../backend/stream-queue-backend.js';
import { reconcileStreamJobs, releaseStreamJob, STREAM_QUEUE_GLOBAL_LIMIT, STREAM_QUEUE_SUBSCRIPTION_LIMIT } from '../../backend/stream-queue-admission.js';
const socket = process.env.MISSKEY_OAUTH_REDIS_SOCKET;
const data = () => ({ source: { id: 'occurrence', channel: 'broadcast', createdAt: Date.now(), message: { type: 'emojiAdded', body: { emojiId: 'emoji' } } } });
describe.skipIf(!socket)('atomic generalized stream queue', () => {
	it('caps concurrent admissions with job insertion and repairs stale terminal reservations', async () => {
		if (!socket?.includes('/misskey-oauth-')) throw new Error('Task-owned fixture required');
		const connection = { path: socket, maxRetriesPerRequest: null }; const name = `stream-${randomUUID()}`;
		const first = new Queue(name, { connection }, streamQueueBackendFactory); const second = new Queue(name, { connection }, streamQueueBackendFactory);
		try {
			const results = await Promise.allSettled(Array.from({ length: 256 }, (_, i) => (i % 2 ? first : second).add('sub', data(), { jobId: `id-${i}` })));
			expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(STREAM_QUEUE_SUBSCRIPTION_LIMIT);
			for (const result of results) if (result.status === 'rejected') expect(result.reason).toBeInstanceOf(StreamQueueFullError);
			expect(await first.getWaitingCount()).toBe(128);
			await expect(first.add('another', data(), { jobId: 'delay-bypass', delay: 1000 })).rejects.toThrow('Unsupported MCP stream producer options');
			const accepted = results.findIndex(result => result.status === 'fulfilled');
			await first.add('sub', data(), { jobId: `id-${accepted}` }); expect(await first.getWaitingCount()).toBe(128);
			const client = await first.getBackend().client;
			expect(Object.keys(await client.hgetall(first.toKey('stream-pending')))).toHaveLength(128);
			const seed: Record<string, string> = {};
			for (let i = 128; i < STREAM_QUEUE_GLOBAL_LIMIT; i++) seed[`seed-${i}`] = `sub-${i}`;
			await client.hset(first.toKey('stream-pending'), seed);
			await expect(second.add('another', data(), { jobId: 'global-overflow' })).rejects.toBeInstanceOf(StreamQueueFullError);
			await reconcileStreamJobs(first); // Absent records are safe to reclaim after atomic insertion.
			expect(Object.keys(await client.hgetall(first.toKey('stream-pending')))).toHaveLength(128);
		} finally {
			const client = await first.getBackend().client; await client.del(first.toKey('stream-pending'), first.toKey('stream-pending-sub'));
			await first.obliterate({ force: true }); await Promise.all([first.close(), second.close()]);
		}
	}, 30000);
	it('deduplicates two producers and two workers, retains retry slots and 24h terminal identities', async () => {
		if (!socket?.includes('/misskey-oauth-')) throw new Error('Task-owned fixture required');
		const connection = { path: socket, maxRetriesPerRequest: null }; const name = `stream-${randomUUID()}`;
		const first = new Queue(name, { connection }, streamQueueBackendFactory); const second = new Queue(name, { connection }, streamQueueBackendFactory);
		const workers: Worker[] = []; let calls = 0;
		try {
			await Promise.all(Array.from({ length: 20 }, (_, i) => (i % 2 ? first : second).add('sub', data(), { jobId: 'same-occurrence', attempts: 2, backoff: { type: 'fixed', delay: 500 }, removeOnComplete: { age: 86400 } })));
			expect(await first.getWaitingCount()).toBe(1);
			for (let i = 0; i < 2; i++) workers.push(new Worker(name, async job => {
				calls++; if (job.id === 'final-failure') throw new UnrecoverableError('Synthetic failure');
				if (!job.attemptsMade) throw new Error('Synthetic retry'); return 'Synthetic success';
			}, { connection, concurrency: 1 }));
			await vi.waitFor(async () => expect(await first.getDelayedCount()).toBe(1));
			await reconcileStreamJobs(second); const client = await first.getBackend().client;
			expect(Object.keys(await client.hgetall(first.toKey('stream-pending')))).toHaveLength(1);
			await vi.waitFor(async () => expect(await first.getCompletedCount()).toBe(1), { timeout: 5000 }); expect(calls).toBe(2);
			await first.add('sub', data(), { jobId: 'final-failure', attempts: 4, removeOnFail: { age: 86400 } });
			await vi.waitFor(async () => expect(await first.getFailedCount()).toBe(1), { timeout: 5000 }); await reconcileStreamJobs(second);
			expect(Object.keys(await client.hgetall(first.toKey('stream-pending')))).toHaveLength(0);
			await second.add('sub', data(), { jobId: 'same-occurrence' }); await second.add('sub', data(), { jobId: 'final-failure' });
			expect(await first.getWaitingCount()).toBe(0); expect(calls).toBe(3);
			expect(Object.keys(await client.hgetall(first.toKey('stream-pending')))).toHaveLength(0);
			await releaseStreamJob(first, 'same-occurrence', 'sub');
			await expect(first.add('sub', { source: { ...data().source, createdAt: Date.now() - 900001 } }, { jobId: 'expired' })).rejects.toBeInstanceOf(StreamQueueExpiredError);
			expect(await first.getJob('expired')).toBeUndefined();
		} finally {
			await Promise.all(workers.map(worker => worker.close())); const client = await first.getBackend().client;
			await client.del(first.toKey('stream-pending'), first.toKey('stream-pending-sub')); await first.obliterate({ force: true }); await Promise.all([first.close(), second.close()]);
		}
	}, 15000);
});
