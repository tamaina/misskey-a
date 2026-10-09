/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { adminGetIndexStatsInput, adminGetIndexStatsOutput } from './endpoints/admin/get-index-stats.contract.js';
import type { adminGetTableStatsInput, adminGetTableStatsOutput } from './endpoints/admin/get-table-stats.contract.js';
import type { adminQueueClearInput, adminQueueClearOutput } from './endpoints/admin/queue/clear.contract.js';
import type { adminQueueDeliverDelayedInput, adminQueueDeliverDelayedOutput } from './endpoints/admin/queue/deliver-delayed.contract.js';
import type { adminQueueInboxDelayedInput, adminQueueInboxDelayedOutput } from './endpoints/admin/queue/inbox-delayed.contract.js';
import type { adminQueueJobsInput, adminQueueJobsOutput } from './endpoints/admin/queue/jobs.contract.js';
import type { adminQueuePauseInput, adminQueuePauseOutput } from './endpoints/admin/queue/pause.contract.js';
import type { adminQueuePromoteJobsInput, adminQueuePromoteJobsOutput } from './endpoints/admin/queue/promote-jobs.contract.js';
import type { adminQueueQueueStatsInput, adminQueueQueueStatsOutput } from './endpoints/admin/queue/queue-stats.contract.js';
import type { adminQueueQueuesInput, adminQueueQueuesOutput } from './endpoints/admin/queue/queues.contract.js';
import type { adminQueueRemoveJobInput, adminQueueRemoveJobOutput } from './endpoints/admin/queue/remove-job.contract.js';
import type { adminQueueResumeInput, adminQueueResumeOutput } from './endpoints/admin/queue/resume.contract.js';
import type { adminQueueRetryJobInput, adminQueueRetryJobOutput } from './endpoints/admin/queue/retry-job.contract.js';
import type { adminQueueShowJobLogsInput, adminQueueShowJobLogsOutput } from './endpoints/admin/queue/show-job-logs.contract.js';
import type { adminQueueShowJobInput, adminQueueShowJobOutput } from './endpoints/admin/queue/show-job.contract.js';
import type { adminQueueStatsInput, adminQueueStatsOutput } from './endpoints/admin/queue/stats.contract.js';
import type { resetDbInput, resetDbOutput } from './endpoints/reset-db.contract.js';

export interface OperationsApiOperations<Actor extends ApiActor> {
	adminGetIndexStats(input: v.InferOutput<typeof adminGetIndexStatsInput>, actor: Actor): Promise<v.InferOutput<typeof adminGetIndexStatsOutput>>;
	adminGetTableStats(input: v.InferOutput<typeof adminGetTableStatsInput>, actor: Actor): Promise<v.InferOutput<typeof adminGetTableStatsOutput>>;
	adminQueueClear(input: v.InferOutput<typeof adminQueueClearInput>, actor: Actor): Promise<v.InferOutput<typeof adminQueueClearOutput>>;
	adminQueueDeliverDelayed(input: v.InferOutput<typeof adminQueueDeliverDelayedInput>, actor: Actor): Promise<v.InferOutput<typeof adminQueueDeliverDelayedOutput>>;
	adminQueueInboxDelayed(input: v.InferOutput<typeof adminQueueInboxDelayedInput>, actor: Actor): Promise<v.InferOutput<typeof adminQueueInboxDelayedOutput>>;
	adminQueueJobs(input: v.InferOutput<typeof adminQueueJobsInput>, actor: Actor): Promise<v.InferOutput<typeof adminQueueJobsOutput>>;
	adminQueuePause(input: v.InferOutput<typeof adminQueuePauseInput>, actor: Actor): Promise<v.InferOutput<typeof adminQueuePauseOutput>>;
	adminQueuePromoteJobs(input: v.InferOutput<typeof adminQueuePromoteJobsInput>, actor: Actor): Promise<v.InferOutput<typeof adminQueuePromoteJobsOutput>>;
	adminQueueQueueStats(input: v.InferOutput<typeof adminQueueQueueStatsInput>, actor: Actor): Promise<v.InferOutput<typeof adminQueueQueueStatsOutput>>;
	adminQueueQueues(input: v.InferOutput<typeof adminQueueQueuesInput>, actor: Actor): Promise<v.InferOutput<typeof adminQueueQueuesOutput>>;
	adminQueueRemoveJob(input: v.InferOutput<typeof adminQueueRemoveJobInput>, actor: Actor): Promise<v.InferOutput<typeof adminQueueRemoveJobOutput>>;
	adminQueueResume(input: v.InferOutput<typeof adminQueueResumeInput>, actor: Actor): Promise<v.InferOutput<typeof adminQueueResumeOutput>>;
	adminQueueRetryJob(input: v.InferOutput<typeof adminQueueRetryJobInput>, actor: Actor): Promise<v.InferOutput<typeof adminQueueRetryJobOutput>>;
	adminQueueShowJobLogs(input: v.InferOutput<typeof adminQueueShowJobLogsInput>, actor: Actor): Promise<v.InferOutput<typeof adminQueueShowJobLogsOutput>>;
	adminQueueShowJob(input: v.InferOutput<typeof adminQueueShowJobInput>, actor: Actor): Promise<v.InferOutput<typeof adminQueueShowJobOutput>>;
	adminQueueStats(input: v.InferOutput<typeof adminQueueStatsInput>, actor: Actor): Promise<v.InferOutput<typeof adminQueueStatsOutput>>;
	resetDb(input: v.InferOutput<typeof resetDbInput>, actor: Actor | null): Promise<v.InferOutput<typeof resetDbOutput>>;
}
export type OperationsApiContext<Actor extends ApiActor> = ApiContext<Actor> & { operations: { operations: OperationsApiOperations<Actor> } };
export type OperationsApplications<Actor extends ApiActor> = { [K in keyof OperationsApiOperations<Actor>]: { execute: OperationsApiOperations<Actor>[K] } };

export function createOperationsApiOperations<Actor extends ApiActor>(applications: OperationsApplications<Actor>): OperationsApiOperations<Actor> {
	return {
		adminGetIndexStats: (input, actor) => applications.adminGetIndexStats.execute(input, actor),
		adminGetTableStats: (input, actor) => applications.adminGetTableStats.execute(input, actor),
		adminQueueClear: (input, actor) => applications.adminQueueClear.execute(input, actor),
		adminQueueDeliverDelayed: (input, actor) => applications.adminQueueDeliverDelayed.execute(input, actor),
		adminQueueInboxDelayed: (input, actor) => applications.adminQueueInboxDelayed.execute(input, actor),
		adminQueueJobs: (input, actor) => applications.adminQueueJobs.execute(input, actor),
		adminQueuePause: (input, actor) => applications.adminQueuePause.execute(input, actor),
		adminQueuePromoteJobs: (input, actor) => applications.adminQueuePromoteJobs.execute(input, actor),
		adminQueueQueueStats: (input, actor) => applications.adminQueueQueueStats.execute(input, actor),
		adminQueueQueues: (input, actor) => applications.adminQueueQueues.execute(input, actor),
		adminQueueRemoveJob: (input, actor) => applications.adminQueueRemoveJob.execute(input, actor),
		adminQueueResume: (input, actor) => applications.adminQueueResume.execute(input, actor),
		adminQueueRetryJob: (input, actor) => applications.adminQueueRetryJob.execute(input, actor),
		adminQueueShowJobLogs: (input, actor) => applications.adminQueueShowJobLogs.execute(input, actor),
		adminQueueShowJob: (input, actor) => applications.adminQueueShowJob.execute(input, actor),
		adminQueueStats: (input, actor) => applications.adminQueueStats.execute(input, actor),
		resetDb: (input, actor) => applications.resetDb.execute(input, actor),
	};
}
