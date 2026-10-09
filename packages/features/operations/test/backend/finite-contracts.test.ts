/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { QueueGetters } from 'bullmq';
import type { IQueueBackend, Queue } from 'bullmq';
import type { DataSource } from 'typeorm';
import type { MiLocalUser } from '../../../users/backend/models/User.js';
import { QueueService } from '../../../runtime/backend/services/QueueService.js';
import { QUEUE_TYPES, queueCounterSchema as packedQueueCountSchema, queueMetricsSchema as packedQueueMetricsSchema, queueJobSchema as packedQueueJobSchema } from '../../backend/queue.schema.js';
import { adminQueuePauseContract } from '../../backend/endpoints/admin/queue/pause.contract.js';
import { adminQueueClearContract } from '../../backend/endpoints/admin/queue/clear.contract.js';
import { adminQueueRetryJobContract } from '../../backend/endpoints/admin/queue/retry-job.contract.js';
import { adminQueueQueuesContract } from '../../backend/endpoints/admin/queue/queues.contract.js';
import { adminQueueQueueStatsContract } from '../../backend/endpoints/admin/queue/queue-stats.contract.js';
import { adminGetTableStatsContract } from '../../backend/endpoints/admin/get-table-stats.contract.js';
import { adminGetIndexStatsContract } from '../../backend/endpoints/admin/get-index-stats.contract.js';
import { adminQueueStatsContract } from '../../backend/endpoints/admin/queue/stats.contract.js';
import { AdminQueueStatsApplicationService as AggregateStats } from '../../backend/endpoints/admin/queue/stats.application.js';
import { AdminGetTableStatsApplicationService as TableStats } from '../../backend/endpoints/admin/get-table-stats.application.js';
import { AdminGetIndexStatsApplicationService as IndexStats } from '../../backend/endpoints/admin/get-index-stats.application.js';

const metrics = { meta: { count: 3, prevTS: 1, prevCount: 2 }, data: [1, 2], count: 3 };
const counts = { waiting: 1, active: 2, completed: 3, failed: 4, delayed: 5 };
const redisInfo = [
	'redis_version:7.2.0', 'redis_mode:standalone', 'run_id:fixture', 'process_id:123', 'tcp_port:6379',
	'os:Linux', 'uptime_in_seconds:9', 'total_system_memory:1024', 'maxmemory:512', 'used_memory:128',
	'mem_fragmentation_ratio:2', 'used_memory_peak:256', 'connected_clients:3', 'blocked_clients:1',
].join('\r\n');

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function rejectsFields(schema: v.GenericSchema, result: Record<string, unknown>) {
	expect(v.parse(schema, result)).toEqual(result);
	expect(v.safeParse(schema, { ...result, future: true }).success).toBe(false);
	for (const [key, value] of Object.entries(result)) {
		const missing = { ...result };
		delete missing[key];
		expect(v.safeParse(schema, missing).success, `missing ${key}`).toBe(false);
		expect(v.safeParse(schema, { ...result, [key]: typeof value === 'string' ? 1 : 'wrong' }).success, `wrong ${key}`).toBe(false);
	}
}

test('actual queue service envelopes preserve dynamic count names and finite metric/Redis wrappers', async () => {
	const queue = mockDeep<Queue>({ qualifiedName: 'bull:system' });
	queue.getJobCounts.mockResolvedValue({ ...counts, prioritized: 7 });
	queue.isPaused.mockResolvedValue(false);
	queue.getMetrics.mockResolvedValue(metrics);
	type Backend = ReturnType<Queue['getBackend']>;
	const redis = mockDeep<Awaited<Backend['client']>>();
	const backend = mockDeep<Backend>();
	Object.defineProperty(backend, 'client', { value: Promise.resolve(redis) });
	redis.info.mockResolvedValue(redisInfo);
	queue.getBackend.mockReturnValue(backend);
	// Exercise the actual methods with the narrow queue lookup dependency.
	const receiver = { getQueue: () => queue };
	const rows = await Reflect.apply(QueueService.prototype.queueGetQueues, receiver, []);
	expect(rows).toHaveLength(QUEUE_TYPES.length);
	expect(v.parse(adminQueueQueuesContract['~orpc'].outputSchema!, rows)).toEqual(rows);
	for (const invalid of [{ ...rows[0], future: true }, { ...rows[0], metrics: { ...rows[0].metrics, future: true } }, { ...rows[0], counts: { custom: 'bad' } }]) expect(v.safeParse(adminQueueQueuesContract['~orpc'].outputSchema!, [invalid]).success).toBe(false);
	const result = await Reflect.apply(QueueService.prototype.queueGetQueue, receiver, ['system']);
	rejectsFields(adminQueueQueueStatsContract['~orpc'].outputSchema!, result);
	for (const path of [['metrics'], ['metrics', 'completed'], ['metrics', 'completed', 'meta'], ['db'], ['db', 'memory'], ['db', 'clients']]) {
		for (const mutation of ['extra', 'missing', 'wrong']) {
			const invalid = structuredClone(result);
			let branch: Record<string, unknown> = invalid;
			for (const key of path) {
				const child = branch[key];
				if (!isRecord(child)) throw new Error(`Invalid branch ${key}`);
				branch = child;
			}
			const first = Object.keys(branch)[0];
			if (mutation === 'extra') branch.future = true;
			else if (mutation === 'missing') delete branch[first];
			else branch[first] = typeof branch[first] === 'string' ? 1 : 'wrong';
			expect(v.safeParse(adminQueueQueueStatsContract['~orpc'].outputSchema!, invalid).success, `${path.join('.')}:${mutation}`).toBe(false);
		}
	}
	expect(result.counts.prioritized).toBe(7);
	expect(result.db.memory).toEqual({ total: 1024, used: 128, fragmentationRatio: 2, peak: 256 });
});

test('finite queue counts, metrics, aggregate wrappers and table record values reject shape drift', () => {
	rejectsFields(packedQueueCountSchema, counts);
	rejectsFields(packedQueueMetricsSchema, metrics);
	const stats = { deliver: counts, inbox: counts, db: counts, objectStorage: counts };
	rejectsFields(adminQueueStatsContract['~orpc'].outputSchema!, stats);
	for (const value of [{ ...counts, future: true }, { ...counts, waiting: undefined }, { ...counts, waiting: 'bad' }]) expect(v.safeParse(adminQueueStatsContract['~orpc'].outputSchema!, { ...stats, deliver: value }).success).toBe(false);
	expect(v.parse(adminGetTableStatsContract['~orpc'].outputSchema!, { custom_table: { count: 2, size: 1024 } })).toEqual({ custom_table: { count: 2, size: 1024 } });
	for (const value of [{ count: 2, size: 1024, future: true }, { count: 2 }, { count: 'bad', size: 1024 }]) expect(v.safeParse(adminGetTableStatsContract['~orpc'].outputSchema!, { custom_table: value }).success).toBe(false);
});

test('native queue requests strip extras and reject invalid selectors', () => {
 for (const schema of [adminQueuePauseContract['~orpc'].inputSchema!, adminQueueClearContract['~orpc'].inputSchema!, adminQueueRetryJobContract['~orpc'].inputSchema!]) {
  expect(v.parse(schema, { queue: 'system', state: '*', jobId: 'job1', future: true })).not.toHaveProperty('future');
  for (const input of [{}, { queue: 'unsupported' }, { queue: 1 }]) expect(v.safeParse(schema, input).success).toBe(false);
 }
 expect(v.safeParse(adminQueuePauseContract['~orpc'].inputSchema!, []).success).toBe(false);
});

test('finite pg_indexes wire schema preserves all five SELECT-star columns and nullable source paths', async () => {
	const rows = [{ schemaname: 'public', tablename: 'note', indexname: 'note_pkey', tablespace: null, indexdef: 'CREATE UNIQUE INDEX ...' }];
	const db = mockDeep<DataSource>();
	db.query.mockResolvedValue(rows);
	const result = await new IndexStats(db).execute({}, mockDeep<MiLocalUser>());
	expect(v.parse(adminGetIndexStatsContract['~orpc'].outputSchema!, result)).toEqual(rows);
	expect(db.query).toHaveBeenCalledWith('SELECT * FROM pg_indexes;');
	expect(result[0]).toEqual(rows[0]);
	for (const field of ['schemaname', 'tablespace', 'indexdef'] as const) {
		const nullable = [{ ...rows[0], [field]: null }];
		expect(v.parse(adminGetIndexStatsContract['~orpc'].outputSchema!, nullable)).toEqual(nullable);
	}
	for (const value of [
		{ ...rows[0], future: true },
		{ ...rows[0], schemaname: 7 },
		{ ...rows[0], tablespace: 7 },
		{ ...rows[0], indexdef: 7 },
		{ ...rows[0], tablename: null },
		{ ...rows[0], indexname: null },
	]) expect(v.safeParse(adminGetIndexStatsContract['~orpc'].outputSchema!, [value]).success).toBe(false);
	for (const field of ['schemaname', 'tablename', 'indexname', 'tablespace', 'indexdef'] as const) {
		const missing: Record<string, string | null> = { ...rows[0] };
		delete missing[field];
		expect(v.safeParse(adminGetIndexStatsContract['~orpc'].outputSchema!, [missing]).success).toBe(false);
	}
	const extended = [{ ...rows[0], future: true }];
 db.query.mockResolvedValue(extended);
 await expect(new IndexStats(db).execute({}, mockDeep<MiLocalUser>())).rejects.toThrow();
 const json: unknown = JSON.parse('{"__proto__":{"note":true},"constructor":null}');
 const job = { id: 'job1', name: 'deliver', data: json, opts: {}, timestamp: 1, progress: 0, attempts: 0, delay: 0, stacktrace: [], returnValue: json, isFailed: false };
 expect(v.parse(packedQueueJobSchema, job)).toEqual(job);
 for (const data of [new Map(), new Date(), { invalid: undefined }]) expect(v.safeParse(packedQueueJobSchema, { ...job, data }).success).toBe(false);
});

test('installed Bull default counts and metrics agree with actual aggregate/table producers', async () => {
	const defaultTypes = ['active', 'completed', 'delayed', 'failed', 'prioritized', 'waiting', 'waiting-children'];
	const getCounts = async (types: string[]) => {
		expect(types).toEqual(defaultTypes);
		return types.map(() => 0);
	};
	const backend = mockDeep<IQueueBackend>({ qualifiedName: 'bull:fixture', keys: {} });
	backend.getCounts.mockImplementation(getCounts);
	const queue = new QueueGetters('fixture', { connection: {} }, () => backend);
	const produced = await queue.getJobCounts();
	expect(Object.keys(produced)).toEqual(defaultTypes);
	expect(produced).toEqual({ active: 0, completed: 0, delayed: 0, failed: 0, prioritized: 0, waiting: 0, 'waiting-children': 0 });
	expect(v.parse(packedQueueCountSchema, produced)).toEqual(produced);
	expect(v.safeParse(packedQueueCountSchema, { ...produced, paused: 0 }).success).toBe(false);
	expect(v.safeParse(packedQueueCountSchema, { ...produced, prioritized: 'bad' }).success).toBe(false);
	expect(v.safeParse(packedQueueCountSchema, { ...produced, 'waiting-children': 'bad' }).success).toBe(false);
	backend.getCounts.mockResolvedValue(defaultTypes.map(() => NaN));
	const absent = await queue.getJobCounts();
	expect(absent).toEqual(produced);
	backend.getMetrics.mockResolvedValue([[], [], 0]);
	const emptyMetrics = await queue.getMetrics('completed');
	expect(v.parse(packedQueueMetricsSchema, emptyMetrics)).toEqual({ meta: { count: 0, prevTS: 0, prevCount: 0 }, data: [], count: 0 });
	type Parameters = ConstructorParameters<typeof AggregateStats>;
	const deliver = mockDeep<Parameters[3]>();
	const inbox = mockDeep<Parameters[4]>();
	const dbQueue = mockDeep<Parameters[5]>();
	const storage = mockDeep<Parameters[6]>();
	for (const queue of [deliver, inbox, dbQueue, storage]) queue.getJobCounts.mockResolvedValue(produced);
	const result = await new AggregateStats(mockDeep(), mockDeep(), mockDeep(), deliver, inbox, dbQueue, storage, mockDeep(), mockDeep()).execute({}, mockDeep<MiLocalUser>());
	expect(v.parse(adminQueueStatsContract['~orpc'].outputSchema!, result)).toEqual({ deliver: produced, inbox: produced, db: produced, objectStorage: produced });
	for (const queue of [deliver, inbox, dbQueue, storage]) expect(queue.getJobCounts).toHaveBeenCalledWith();
	const db = mockDeep<DataSource>();
	db.query.mockResolvedValue([{ table: 'custom_table', count: '3', size: '1024' }]);
	const tables = await new TableStats(db).execute({}, mockDeep<MiLocalUser>());
	expect(v.parse(adminGetTableStatsContract['~orpc'].outputSchema!, tables)).toEqual({ custom_table: { count: 3, size: 1024 } });
});
