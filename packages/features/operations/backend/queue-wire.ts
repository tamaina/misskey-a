/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { toPackedJsonValue } from '@features/users/backend/json-value.schema.js';

type QueueRow = Awaited<ReturnType<QueueService['queueGetQueues']>>[number];
type Job = Awaited<ReturnType<QueueService['queueGetJob']>>;
export function toQueueCounts(input: Record<string, number>) {
	return {
		active: input.active, completed: input.completed, delayed: input.delayed, failed: input.failed, waiting: input.waiting,
		...(input.prioritized === undefined ? {} : { prioritized: input.prioritized }),
		...(input['waiting-children'] === undefined ? {} : { 'waiting-children': input['waiting-children'] }),
	};
}

function toQueueMetrics(input: QueueRow['metrics']['completed']) {
	return { meta: { count: input.meta.count, prevTS: input.meta.prevTS, prevCount: input.meta.prevCount }, data: [...input.data], count: input.count };
}

export function toQueueOverview(input: QueueRow) {
	return { name: input.name, counts: toQueueCounts(input.counts), isPaused: input.isPaused, metrics: { completed: toQueueMetrics(input.metrics.completed), failed: toQueueMetrics(input.metrics.failed) } };
}
export function toQueueDetails(input: Awaited<ReturnType<QueueService['queueGetQueue']>>) {
	return {
		...toQueueOverview(input), qualifiedName: input.qualifiedName,
		db: {
			version: input.db.version, mode: input.db.mode, runId: input.db.runId, processId: input.db.processId, port: input.db.port, os: input.db.os, uptime: input.db.uptime,
			memory: { total: input.db.memory.total, used: input.db.memory.used, fragmentationRatio: input.db.memory.fragmentationRatio, peak: input.db.memory.peak },
			clients: { blocked: input.db.clients.blocked, connected: input.db.clients.connected },
		},
	};
}

function toRetention(input: Job['opts']['removeOnComplete']) {
	return typeof input === 'object' && input !== null ? { age: input.age, count: input.count } : input;
}

function toDeduplication(input: NonNullable<Job['opts']['deduplication']>) {
	return { id: input.id, ttl: input.ttl, extend: input.extend, replace: input.replace, keepLastIfActive: input.keepLastIfActive };
}

export function toQueueJob(input: Job) {
	const opts = input.opts;
	return {
		id: input.id, name: input.name, data: toPackedJsonValue(input.data),
		opts: {
			timestamp: opts.timestamp, priority: opts.priority, delay: opts.delay, attempts: opts.attempts,
			backoff: typeof opts.backoff === 'object' && opts.backoff !== null ? { type: opts.backoff.type, delay: opts.backoff.delay, jitter: opts.backoff.jitter } : opts.backoff,
			lifo: opts.lifo, removeOnComplete: toRetention(opts.removeOnComplete), removeOnFail: toRetention(opts.removeOnFail), keepLogs: opts.keepLogs,
			stackTraceLimit: opts.stackTraceLimit, sizeLimit: opts.sizeLimit, repeatJobKey: opts.repeatJobKey, jobId: opts.jobId,
			parent: opts.parent === undefined ? undefined : { id: opts.parent.id, queue: opts.parent.queue }, prevMillis: opts.prevMillis,
			deduplication: opts.deduplication === undefined ? undefined : toDeduplication(opts.deduplication),
			debounce: opts.debounce === undefined ? undefined : toDeduplication(opts.debounce),
			failParentOnFailure: opts.failParentOnFailure, continueParentOnFailure: opts.continueParentOnFailure, ignoreDependencyOnFailure: opts.ignoreDependencyOnFailure,
			removeDependencyOnFailure: opts.removeDependencyOnFailure,
			telemetry: opts.telemetry === undefined ? undefined : { metadata: opts.telemetry.metadata, omitContext: opts.telemetry.omitContext },
			repeat: opts.repeat === undefined ? undefined : { endDate: opts.repeat.endDate, startDate: opts.repeat.startDate, pattern: opts.repeat.pattern, cron: opts.repeat.cron, key: opts.repeat.key, limit: opts.repeat.limit, every: opts.repeat.every, immediately: opts.repeat.immediately, count: opts.repeat.count, offset: opts.repeat.offset, prevMillis: opts.repeat.prevMillis, jobId: opts.repeat.jobId, tz: opts.repeat.tz },
		},
		timestamp: input.timestamp, processedOn: input.processedOn, processedBy: input.processedBy, finishedOn: input.finishedOn,
		progress: toPackedJsonValue(input.progress), attempts: input.attempts, delay: input.delay, failedReason: input.failedReason,
		stacktrace: [...input.stacktrace], returnValue: input.returnValue === undefined ? undefined : toPackedJsonValue(input.returnValue), isFailed: input.isFailed,
	};
}
