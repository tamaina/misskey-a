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
import { QUEUE_TYPES } from '../../../runtime/shared/queue-types.js';
import { packedQueueCountSchema, packedQueueMetricsSchema, packedQueueJobSchema } from '../../contract/packed.js';
import { operationsInputs } from '../../contract/index.js';
import { referenceAdminQueueQueuesOutput, referenceAdminQueueQueueStatsOutput, referenceAdminQueueQueueStatsDefinition } from '../../contract/reference-endpoint-definitions.js';
import { inlineAdminGetTableStatsOutput, inlineAdminGetIndexStatsOutput } from '../../contract/endpoint-definitions.js';
import { queueStatsOutput } from '../../contract/queue-stats-endpoint-definition.js';
import { EndpointImplementation as AggregateStats } from '../../backend/endpoints/admin/queue/stats.js';
import { EndpointImplementation as TableStats } from '../../backend/endpoints/admin/get-table-stats.js';
import { EndpointImplementation as IndexStats } from '../../backend/endpoints/admin/get-index-stats.js';
import { ContractEndpoint, projectEndpointContract } from '../../../api/backend/transport/contract-endpoint.js';

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
	expect(v.parse(referenceAdminQueueQueuesOutput, rows)).toEqual(rows);
	for (const invalid of [{ ...rows[0], future: true }, { ...rows[0], metrics: { ...rows[0].metrics, future: true } }, { ...rows[0], counts: { custom: 'bad' } }]) expect(v.safeParse(referenceAdminQueueQueuesOutput, [invalid]).success).toBe(false);
	const result = await Reflect.apply(QueueService.prototype.queueGetQueue, receiver, ['system']);
	rejectsFields(referenceAdminQueueQueueStatsOutput, result);
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
			expect(v.safeParse(referenceAdminQueueQueueStatsOutput, invalid).success, `${path.join('.')}:${mutation}`).toBe(false);
		}
	}
	expect(result.counts.prioritized).toBe(7);
	expect(result.db.memory).toEqual({ total: 1024, used: 128, fragmentationRatio: 2, peak: 256 });
});

test('finite queue counts, metrics, aggregate wrappers and table record values reject shape drift', () => {
	rejectsFields(packedQueueCountSchema, counts);
	rejectsFields(packedQueueMetricsSchema, metrics);
	const stats = { deliver: counts, inbox: counts, db: counts, objectStorage: counts };
	rejectsFields(queueStatsOutput, stats);
	for (const value of [{ ...counts, future: true }, { ...counts, waiting: undefined }, { ...counts, waiting: 'bad' }]) expect(v.safeParse(queueStatsOutput, { ...stats, deliver: value }).success).toBe(false);
	expect(v.parse(inlineAdminGetTableStatsOutput, { custom_table: { count: 2, size: 1024 } })).toEqual({ custom_table: { count: 2, size: 1024 } });
	for (const value of [{ count: 2, size: 1024, future: true }, { count: 2 }, { count: 'bad', size: 1024 }]) expect(v.safeParse(inlineAdminGetTableStatsOutput, { custom_table: value }).success).toBe(false);
});

test('native queue requests strip extras while HTTP retains the original request and unparsed output', async () => {
	for (const schema of Object.values(operationsInputs)) {
		const request = { queue: 'system', jobId: 'job1', state: '*', future: true };
		expect(v.parse(schema, request)).not.toHaveProperty('future');
		for (const input of [{}, { queue: 'unsupported' }, { queue: 1 }]) expect(v.safeParse(schema, input).success).toBe(false);
	}
	const request = { queue: 'system', future: true };
	const response = { name: 'system' as const, qualifiedName: 'bull:system', counts, isPaused: false, metrics: { completed: metrics, failed: metrics }, db: { version: '7.2.0', mode: 'standalone' as const, runId: 'fixture', processId: '123', port: 6379, os: 'Linux', uptime: 9, memory: { total: 1024, used: 128, fragmentationRatio: 2, peak: 256 }, clients: { connected: 3, blocked: 1 } }, future: true };
	const endpoint = new ContractEndpoint({}, projectEndpointContract(referenceAdminQueueQueueStatsDefinition), async ps => { expect(ps).toBe(request); return response; });
	expect(await endpoint.exec(request, null, null)).toBe(response);
	expect(request).toEqual({ queue: 'system', future: true });
	await expect(endpoint.exec({ queue: 'unsupported' }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
});

test('reviewed pg_indexes producer boundary preserves full SELECT-star rows', async () => {
	const rows = [{ schemaname: 'public', tablename: 'note', indexname: 'note_pkey', tablespace: null, indexdef: 'CREATE UNIQUE INDEX ...' }];
	const db = mockDeep<DataSource>();
	db.query.mockResolvedValue(rows);
	const result = await new IndexStats(db).exec({}, mockDeep<MiLocalUser>(), null);
	expect(v.parse(inlineAdminGetIndexStatsOutput, result)).toEqual(rows);
	expect(db.query).toHaveBeenCalledWith('SELECT * FROM pg_indexes;');
	// The dynamic job schema stays a separate producer review boundary in this cohort.
	expect(packedQueueJobSchema.type).toBe('loose_object');
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
	const result = await new AggregateStats(mockDeep(), mockDeep(), mockDeep(), deliver, inbox, dbQueue, storage, mockDeep(), mockDeep()).exec({}, mockDeep<MiLocalUser>(), null);
	expect(v.parse(queueStatsOutput, result)).toEqual({ deliver: produced, inbox: produced, db: produced, objectStorage: produced });
	for (const queue of [deliver, inbox, dbQueue, storage]) expect(queue.getJobCounts).toHaveBeenCalledWith();
	const db = mockDeep<DataSource>();
	db.query.mockResolvedValue([{ table: 'custom_table', count: '3', size: '1024' }]);
	const tables = await new TableStats(db).exec({}, mockDeep<MiLocalUser>(), null);
	expect(v.parse(inlineAdminGetTableStatsOutput, tables)).toEqual({ custom_table: { count: 3, size: 1024 } });
});
