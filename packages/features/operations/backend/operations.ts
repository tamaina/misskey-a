/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { AdminGetIndexStatsInput, AdminGetIndexStatsOutput } from './endpoints/admin/get-index-stats.contract.js';
import type { AdminGetTableStatsInput, AdminGetTableStatsOutput } from './endpoints/admin/get-table-stats.contract.js';
import type { AdminQueueClearInput, AdminQueueClearOutput } from './endpoints/admin/queue/clear.contract.js';
import type { AdminQueueDeliverDelayedInput, AdminQueueDeliverDelayedOutput } from './endpoints/admin/queue/deliver-delayed.contract.js';
import type { AdminQueueInboxDelayedInput, AdminQueueInboxDelayedOutput } from './endpoints/admin/queue/inbox-delayed.contract.js';
import type { AdminQueueJobsInput, AdminQueueJobsOutput } from './endpoints/admin/queue/jobs.contract.js';
import type { AdminQueuePauseInput, AdminQueuePauseOutput } from './endpoints/admin/queue/pause.contract.js';
import type { AdminQueuePromoteJobsInput, AdminQueuePromoteJobsOutput } from './endpoints/admin/queue/promote-jobs.contract.js';
import type { AdminQueueQueueStatsInput, AdminQueueQueueStatsOutput } from './endpoints/admin/queue/queue-stats.contract.js';
import type { AdminQueueQueuesInput, AdminQueueQueuesOutput } from './endpoints/admin/queue/queues.contract.js';
import type { AdminQueueRemoveJobInput, AdminQueueRemoveJobOutput } from './endpoints/admin/queue/remove-job.contract.js';
import type { AdminQueueResumeInput, AdminQueueResumeOutput } from './endpoints/admin/queue/resume.contract.js';
import type { AdminQueueRetryJobInput, AdminQueueRetryJobOutput } from './endpoints/admin/queue/retry-job.contract.js';
import type { AdminQueueShowJobLogsInput, AdminQueueShowJobLogsOutput } from './endpoints/admin/queue/show-job-logs.contract.js';
import type { AdminQueueShowJobInput, AdminQueueShowJobOutput } from './endpoints/admin/queue/show-job.contract.js';
import type { AdminQueueStatsInput, AdminQueueStatsOutput } from './endpoints/admin/queue/stats.contract.js';
import type { ResetDbInput, ResetDbOutput } from './endpoints/reset-db.contract.js';

export interface OperationsApiOperations<Actor extends ApiActor> {
	adminGetIndexStats(input: AdminGetIndexStatsInput, actor: Actor): Promise<AdminGetIndexStatsOutput>;
	adminGetTableStats(input: AdminGetTableStatsInput, actor: Actor): Promise<AdminGetTableStatsOutput>;
	adminQueueClear(input: AdminQueueClearInput, actor: Actor): Promise<AdminQueueClearOutput>;
	adminQueueDeliverDelayed(input: AdminQueueDeliverDelayedInput, actor: Actor): Promise<AdminQueueDeliverDelayedOutput>;
	adminQueueInboxDelayed(input: AdminQueueInboxDelayedInput, actor: Actor): Promise<AdminQueueInboxDelayedOutput>;
	adminQueueJobs(input: AdminQueueJobsInput, actor: Actor): Promise<AdminQueueJobsOutput>;
	adminQueuePause(input: AdminQueuePauseInput, actor: Actor): Promise<AdminQueuePauseOutput>;
	adminQueuePromoteJobs(input: AdminQueuePromoteJobsInput, actor: Actor): Promise<AdminQueuePromoteJobsOutput>;
	adminQueueQueueStats(input: AdminQueueQueueStatsInput, actor: Actor): Promise<AdminQueueQueueStatsOutput>;
	adminQueueQueues(input: AdminQueueQueuesInput, actor: Actor): Promise<AdminQueueQueuesOutput>;
	adminQueueRemoveJob(input: AdminQueueRemoveJobInput, actor: Actor): Promise<AdminQueueRemoveJobOutput>;
	adminQueueResume(input: AdminQueueResumeInput, actor: Actor): Promise<AdminQueueResumeOutput>;
	adminQueueRetryJob(input: AdminQueueRetryJobInput, actor: Actor): Promise<AdminQueueRetryJobOutput>;
	adminQueueShowJobLogs(input: AdminQueueShowJobLogsInput, actor: Actor): Promise<AdminQueueShowJobLogsOutput>;
	adminQueueShowJob(input: AdminQueueShowJobInput, actor: Actor): Promise<AdminQueueShowJobOutput>;
	adminQueueStats(input: AdminQueueStatsInput, actor: Actor): Promise<AdminQueueStatsOutput>;
	resetDb(input: ResetDbInput, actor: Actor | null): Promise<ResetDbOutput>;
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
