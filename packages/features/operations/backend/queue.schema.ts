/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { rawObjectInputGuard } from '../../api/backend/transport/input.schema.js';
import { packedOptionalJsonValueSchema, packedJsonValueSchema } from '../../users/backend/json-value.schema.js';

export const finiteNumber = v.pipe(v.number(), v.finite());
export const QUEUE_TYPES = ['system', 'endedPollNotification', 'postScheduledNote', 'deliver', 'inbox', 'db', 'relationship', 'objectStorage', 'userWebhookDeliver', 'systemWebhookDeliver'] as const;
export const QUEUE_CLEAR_STATES = ['*', 'completed', 'wait', 'active', 'paused', 'prioritized', 'delayed', 'failed'] as const;

// BullMQ's getJobCounts() default list, including scheduler/priority queues.
export const queueCounterSchema = v.strictObject({
 active: finiteNumber, completed: finiteNumber, delayed: finiteNumber, failed: finiteNumber,
 prioritized: v.optional(finiteNumber), waiting: finiteNumber, 'waiting-children': v.optional(finiteNumber),
});
export const queueMetricsSchema = v.strictObject({
 meta: v.strictObject({ count: finiteNumber, prevTS: finiteNumber, prevCount: finiteNumber }),
 data: v.array(finiteNumber), count: finiteNumber,
});
const number = v.optional(finiteNumber);
const string = v.optional(v.string());
const boolean = v.optional(v.boolean());
const retention = v.optional(v.union([v.boolean(), finiteNumber, v.strictObject({ age: number, count: number })]));
const date = v.optional(v.union([v.string(), finiteNumber]));
const repeat = v.strictObject({
 endDate: date, startDate: date, pattern: string, cron: string, key: string, limit: number, every: number,
 immediately: boolean, count: number, offset: number, prevMillis: number, jobId: string, tz: string,
});
const deduplication = v.strictObject({ id: v.string(), ttl: number, extend: boolean, replace: boolean, keepLastIfActive: boolean });
// These are stored BullMQ options, rather than arbitrary business JSON fields.
const queueJobOptionFields = v.strictObject({
 timestamp: number, priority: number, delay: number, attempts: number,
 backoff: v.optional(v.union([finiteNumber, v.strictObject({ type: v.string(), delay: number, jitter: number })])),
 lifo: boolean, removeOnComplete: retention, removeOnFail: retention, keepLogs: number,
 stackTraceLimit: number, sizeLimit: number, repeatJobKey: string, jobId: string,
 parent: v.optional(v.strictObject({ id: v.string(), queue: v.string() })), prevMillis: number,
 deduplication: v.optional(deduplication), debounce: v.optional(deduplication),
 failParentOnFailure: boolean, continueParentOnFailure: boolean, ignoreDependencyOnFailure: boolean,
 removeDependencyOnFailure: boolean,
 telemetry: v.optional(v.strictObject({ metadata: string, omitContext: boolean })),
 repeat: v.optional(repeat),
});
export const queueJobOptionsSchema = v.intersect([queueJobOptionFields, rawObjectInputGuard]);
// Only data/progress/returnValue are arbitrary persisted job business JSON.
// QueueService redacts webhook secrets before packing and searching these values.
export const queueJobSchema = v.strictObject({
 id: v.string(), name: v.string(), data: packedJsonValueSchema, opts: queueJobOptionsSchema,
 timestamp: finiteNumber, processedOn: number, processedBy: string, finishedOn: number,
 progress: packedJsonValueSchema, attempts: finiteNumber, delay: finiteNumber,
 failedReason: string, stacktrace: v.array(v.string()), returnValue: packedOptionalJsonValueSchema, isFailed: v.boolean(),
});
