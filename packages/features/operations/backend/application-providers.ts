/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AdminGetIndexStatsApplicationService } from './endpoints/admin/get-index-stats.application.js';
import { AdminGetTableStatsApplicationService } from './endpoints/admin/get-table-stats.application.js';
import { AdminQueueClearApplicationService } from './endpoints/admin/queue/clear.application.js';
import { AdminQueueDeliverDelayedApplicationService } from './endpoints/admin/queue/deliver-delayed.application.js';
import { AdminQueueInboxDelayedApplicationService } from './endpoints/admin/queue/inbox-delayed.application.js';
import { AdminQueueJobsApplicationService } from './endpoints/admin/queue/jobs.application.js';
import { AdminQueuePauseApplicationService } from './endpoints/admin/queue/pause.application.js';
import { AdminQueuePromoteJobsApplicationService } from './endpoints/admin/queue/promote-jobs.application.js';
import { AdminQueueQueueStatsApplicationService } from './endpoints/admin/queue/queue-stats.application.js';
import { AdminQueueQueuesApplicationService } from './endpoints/admin/queue/queues.application.js';
import { AdminQueueRemoveJobApplicationService } from './endpoints/admin/queue/remove-job.application.js';
import { AdminQueueResumeApplicationService } from './endpoints/admin/queue/resume.application.js';
import { AdminQueueRetryJobApplicationService } from './endpoints/admin/queue/retry-job.application.js';
import { AdminQueueShowJobLogsApplicationService } from './endpoints/admin/queue/show-job-logs.application.js';
import { AdminQueueShowJobApplicationService } from './endpoints/admin/queue/show-job.application.js';
import { AdminQueueStatsApplicationService } from './endpoints/admin/queue/stats.application.js';
import { ResetDbApplicationService } from './endpoints/reset-db.application.js';

export const operationsApplicationProviders = [
	AdminGetIndexStatsApplicationService,
	AdminGetTableStatsApplicationService,
	AdminQueueClearApplicationService,
	AdminQueueDeliverDelayedApplicationService,
	AdminQueueInboxDelayedApplicationService,
	AdminQueueJobsApplicationService,
	AdminQueuePauseApplicationService,
	AdminQueuePromoteJobsApplicationService,
	AdminQueueQueueStatsApplicationService,
	AdminQueueQueuesApplicationService,
	AdminQueueRemoveJobApplicationService,
	AdminQueueResumeApplicationService,
	AdminQueueRetryJobApplicationService,
	AdminQueueShowJobLogsApplicationService,
	AdminQueueShowJobApplicationService,
	AdminQueueStatsApplicationService,
	ResetDbApplicationService,
];
export const operationsApplicationMap = {
	adminGetIndexStats: AdminGetIndexStatsApplicationService,
	adminGetTableStats: AdminGetTableStatsApplicationService,
	adminQueueClear: AdminQueueClearApplicationService,
	adminQueueDeliverDelayed: AdminQueueDeliverDelayedApplicationService,
	adminQueueInboxDelayed: AdminQueueInboxDelayedApplicationService,
	adminQueueJobs: AdminQueueJobsApplicationService,
	adminQueuePause: AdminQueuePauseApplicationService,
	adminQueuePromoteJobs: AdminQueuePromoteJobsApplicationService,
	adminQueueQueueStats: AdminQueueQueueStatsApplicationService,
	adminQueueQueues: AdminQueueQueuesApplicationService,
	adminQueueRemoveJob: AdminQueueRemoveJobApplicationService,
	adminQueueResume: AdminQueueResumeApplicationService,
	adminQueueRetryJob: AdminQueueRetryJobApplicationService,
	adminQueueShowJobLogs: AdminQueueShowJobLogsApplicationService,
	adminQueueShowJob: AdminQueueShowJobApplicationService,
	adminQueueStats: AdminQueueStatsApplicationService,
	resetDb: ResetDbApplicationService,
};
