/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { adminGetIndexStatsContract } from './endpoints/admin/get-index-stats.contract.js';
import { adminGetTableStatsContract } from './endpoints/admin/get-table-stats.contract.js';
import { adminQueueClearContract } from './endpoints/admin/queue/clear.contract.js';
import { adminQueueDeliverDelayedContract } from './endpoints/admin/queue/deliver-delayed.contract.js';
import { adminQueueInboxDelayedContract } from './endpoints/admin/queue/inbox-delayed.contract.js';
import { adminQueueJobsContract } from './endpoints/admin/queue/jobs.contract.js';
import { adminQueuePauseContract } from './endpoints/admin/queue/pause.contract.js';
import { adminQueuePromoteJobsContract } from './endpoints/admin/queue/promote-jobs.contract.js';
import { adminQueueQueueStatsContract } from './endpoints/admin/queue/queue-stats.contract.js';
import { adminQueueQueuesContract } from './endpoints/admin/queue/queues.contract.js';
import { adminQueueRemoveJobContract } from './endpoints/admin/queue/remove-job.contract.js';
import { adminQueueResumeContract } from './endpoints/admin/queue/resume.contract.js';
import { adminQueueRetryJobContract } from './endpoints/admin/queue/retry-job.contract.js';
import { adminQueueShowJobLogsContract } from './endpoints/admin/queue/show-job-logs.contract.js';
import { adminQueueShowJobContract } from './endpoints/admin/queue/show-job.contract.js';
import { adminQueueStatsContract } from './endpoints/admin/queue/stats.contract.js';
import { resetDbContract } from './endpoints/reset-db.contract.js';

export const operationsApiContract = {
	adminGetIndexStats: adminGetIndexStatsContract,
	adminGetTableStats: adminGetTableStatsContract,
	adminQueueClear: adminQueueClearContract,
	adminQueueDeliverDelayed: adminQueueDeliverDelayedContract,
	adminQueueInboxDelayed: adminQueueInboxDelayedContract,
	adminQueueJobs: adminQueueJobsContract,
	adminQueuePause: adminQueuePauseContract,
	adminQueuePromoteJobs: adminQueuePromoteJobsContract,
	adminQueueQueueStats: adminQueueQueueStatsContract,
	adminQueueQueues: adminQueueQueuesContract,
	adminQueueRemoveJob: adminQueueRemoveJobContract,
	adminQueueResume: adminQueueResumeContract,
	adminQueueRetryJob: adminQueueRetryJobContract,
	adminQueueShowJobLogs: adminQueueShowJobLogsContract,
	adminQueueShowJob: adminQueueShowJobContract,
	adminQueueStats: adminQueueStatsContract,
	resetDb: resetDbContract,
};
