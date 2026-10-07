/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Job, IQueueBackend } from 'bullmq';
import type { InferOutput } from 'valibot';
import type { packedQueueCountSchema } from '../../../features/operations/contract/packed.js';

/**
 * Trusted dependency declaration correction for BullMQ 6.3.2, not response validation.
 * QueueGetters.sanitizeJobTypes defaults seven counters; getJobCounts fills each
 * result with res || 0. RedisQueueBackend.getCounts and getCounts-1.lua return one
 * result per requested state. Keep the upstream argumentful overload unchanged.
 * Recheck the source guarantee and queue-counts regression when upgrading BullMQ.
 */
declare module 'bullmq' {
	interface QueueGetters<JobBase extends Job = Job, B extends IQueueBackend = IQueueBackend> {
		getJobCounts(): Promise<InferOutput<typeof packedQueueCountSchema> & Record<string, number>>;
	}
}
