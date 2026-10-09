/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createProcedureClient } from '@orpc/server';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { toQueueJob } from '../../backend/queue-wire.js';
import { toPackedJsonValue } from '../../../users/backend/json-value.schema.js';
import type { ApiContext, ApiServices, ApiAuthorization } from '../../../api/backend/transport/context.js';
import { expect, test, vi } from 'vitest';
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
import { createAdminQueueShowJobProcedure } from '../../backend/endpoints/admin/queue/show-job.js';
import { adminQueueShowJobContract } from '../../backend/endpoints/admin/queue/show-job.contract.js';
import { createAdminQueueQueuesProcedure } from '../../backend/endpoints/admin/queue/queues.js';
import { createAdminQueueStatsProcedure } from '../../backend/endpoints/admin/queue/stats.js';
import { createAdminGetTableStatsProcedure } from '../../backend/endpoints/admin/get-table-stats.js';
import { createAdminGetIndexStatsProcedure } from '../../backend/endpoints/admin/get-index-stats.js';
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
	const result = await createProcedureClient(createAdminGetIndexStatsProcedure({ db }), { context: nativeContext() })({});
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
	expect(await createProcedureClient(createAdminGetIndexStatsProcedure({ db }), { context: nativeContext() })({})).toEqual(rows);
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
	type Dependencies = Parameters<typeof createAdminQueueStatsProcedure>[0];
	const deliver = mockDeep<Dependencies['deliverQueue']>();
	const inbox = mockDeep<Dependencies['inboxQueue']>();
	const dbQueue = mockDeep<Dependencies['dbQueue']>();
	const storage = mockDeep<Dependencies['objectStorageQueue']>();
	for (const queue of [deliver, inbox, dbQueue, storage]) queue.getJobCounts.mockResolvedValue(produced);
	const result = await createProcedureClient(createAdminQueueStatsProcedure({ deliverQueue: deliver, inboxQueue: inbox, dbQueue, objectStorageQueue: storage }), { context: nativeContext() })({});
	expect(v.parse(adminQueueStatsContract['~orpc'].outputSchema!, result)).toEqual({ deliver: produced, inbox: produced, db: produced, objectStorage: produced });
	for (const queue of [deliver, inbox, dbQueue, storage]) expect(queue.getJobCounts).toHaveBeenCalledWith();
	const db = mockDeep<DataSource>();
	db.query.mockResolvedValue([{ table: 'custom_table', count: '3', size: '1024' }]);
	const tables = await createProcedureClient(createAdminGetTableStatsProcedure({ db }), { context: nativeContext() })({});
	expect(v.parse(adminGetTableStatsContract['~orpc'].outputSchema!, tables)).toEqual({ custom_table: { count: 3, size: 1024 } });
});

function nativeContext(): ApiContext<MiLocalUser> {
	const actor = mockDeep<MiLocalUser>({ id: 'trusted-user', isSuspended: false, movedToUri: null });
	const services = mockDeep<ApiServices<MiLocalUser>>();
	services.authenticate.mockResolvedValue([actor, null]);
	const authorization = mockDeep<ApiAuthorization<MiLocalUser>>();
	authorization.rootUserId.mockReturnValue(actor.id);
	return { services, authorization, credential: 'credential', ip: '127.0.0.1', headers: {} };
}

test('queue HTTP envelopes project outer and nested extras without output schema execution', async () => {
	const queueService = mockDeep<Parameters<typeof createAdminQueueQueuesProcedure>[0]['queueService']>();
	const producedCounts = { ...counts, internalMarker: 999 };
	const producedMetrics = { ...metrics, internalMarker: 'metric', meta: { ...metrics.meta, internalMarker: 'meta' } };
	const produced = { name: 'system', counts: producedCounts, isPaused: false, metrics: { completed: producedMetrics, failed: metrics }, internalMarker: 'outer' } satisfies Awaited<ReturnType<typeof queueService.queueGetQueues>>[number] & { internalMarker: string };
	queueService.queueGetQueues.mockResolvedValue([produced]);
	const outputRun = vi.spyOn(adminQueueQueuesContract['~orpc'].outputSchema!, '~run');
	try {
		const handler = new OpenAPIHandler({ queues: createAdminQueueQueuesProcedure({ queueService }) });
		const response = await handler.handle(new Request('https://local.test/admin/queue/queues', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }), { context: nativeContext() });
		expect(response.response?.status).toBe(200);
		const rows: unknown = await response.response?.json();
		expect(rows).toEqual([{ name: 'system', counts, isPaused: false, metrics: { completed: metrics, failed: metrics } }]);
		expect(outputRun).not.toHaveBeenCalled();
	} finally { outputRun.mockRestore(); }
});

test('queue job HTTP closes nested options and preserves baseline oRPC reserved-key serialization', async () => {
	const queueService = mockDeep<Parameters<typeof createAdminQueueShowJobProcedure>[0]['queueService']>();
	const json = toPackedJsonValue(JSON.parse('{"constructor":{"__proto__":"retained"},"prototype":null}'));
	const produced = {
		id: 'job1', name: 'deliver', data: json, timestamp: 1, progress: json, attempts: 0, delay: 0,
		stacktrace: [], returnValue: json, isFailed: false, internalMarker: 'outer',
		opts: {
			internalMarker: 'opts', backoff: { type: 'fixed', delay: 10, jitter: 0.5, internalMarker: 'backoff' },
			parent: { id: 'parent1', queue: 'deliver', internalMarker: 'parent' },
			removeOnComplete: { age: 60, count: 2, internalMarker: 'retention' },
			deduplication: { id: 'dedup1', ttl: 50, internalMarker: 'deduplication' },
			telemetry: { metadata: 'public', omitContext: true, internalMarker: 'telemetry' },
			repeat: { pattern: '* * * * *', startDate: 1000, internalMarker: 'repeat' },
		},
	};
	const before = JSON.stringify(produced);
	const projected = toQueueJob(produced);
	expect(projected.data).toEqual(json);
	expect(projected.progress).toEqual(json);
	expect(projected.returnValue).toEqual(json);
	expect(JSON.stringify(produced)).toBe(before);
	queueService.queueGetJob.mockResolvedValue(produced);
	const outputRun = vi.spyOn(adminQueueShowJobContract['~orpc'].outputSchema!, '~run');
	try {
		const handler = new OpenAPIHandler({ job: createAdminQueueShowJobProcedure({ queueService }) });
		const response = await handler.handle(new Request('https://local.test/admin/queue/show-job', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"queue":"deliver","jobId":"job1"}' }), { context: nativeContext() });
		expect(response.response?.status).toBe(200);
		const wire: unknown = await response.response?.json();
		// Baseline and current oRPC 1.15.4 serializers assign into {}, dropping own __proto__ keys.
		// The DTO above preserves those JSON keys; constructor/prototype survive the existing transport.
		const transportedJson = { constructor: {}, prototype: null };
		expect(wire).toEqual({
			id: 'job1', name: 'deliver', data: transportedJson, timestamp: 1, progress: transportedJson, attempts: 0, delay: 0,
			stacktrace: [], returnValue: transportedJson, isFailed: false,
			opts: { backoff: { type: 'fixed', delay: 10, jitter: 0.5 }, parent: { id: 'parent1', queue: 'deliver' },
				removeOnComplete: { age: 60, count: 2 }, deduplication: { id: 'dedup1', ttl: 50 },
				telemetry: { metadata: 'public', omitContext: true }, repeat: { pattern: '* * * * *', startDate: 1000 } },
		});
		expect(outputRun).not.toHaveBeenCalled();
	} finally { outputRun.mockRestore(); }
});
