/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { AdminGetIndexStatsDependencies } from './endpoints/admin/get-index-stats.js';
import type { AdminGetTableStatsDependencies } from './endpoints/admin/get-table-stats.js';
import type { AdminQueueClearDependencies } from './endpoints/admin/queue/clear.js';
import type { AdminQueueDeliverDelayedDependencies } from './endpoints/admin/queue/deliver-delayed.js';
import type { AdminQueueInboxDelayedDependencies } from './endpoints/admin/queue/inbox-delayed.js';
import type { AdminQueueJobsDependencies } from './endpoints/admin/queue/jobs.js';
import type { AdminQueuePauseDependencies } from './endpoints/admin/queue/pause.js';
import type { AdminQueuePromoteJobsDependencies } from './endpoints/admin/queue/promote-jobs.js';
import type { AdminQueueQueueStatsDependencies } from './endpoints/admin/queue/queue-stats.js';
import type { AdminQueueQueuesDependencies } from './endpoints/admin/queue/queues.js';
import type { AdminQueueRemoveJobDependencies } from './endpoints/admin/queue/remove-job.js';
import type { AdminQueueResumeDependencies } from './endpoints/admin/queue/resume.js';
import type { AdminQueueRetryJobDependencies } from './endpoints/admin/queue/retry-job.js';
import type { AdminQueueShowJobLogsDependencies } from './endpoints/admin/queue/show-job-logs.js';
import type { AdminQueueShowJobDependencies } from './endpoints/admin/queue/show-job.js';
import type { AdminQueueStatsDependencies } from './endpoints/admin/queue/stats.js';
import type { ResetDbDependencies } from './endpoints/reset-db.js';
export type OperationsDependencies = AdminGetIndexStatsDependencies
	& AdminGetTableStatsDependencies
	& AdminQueueClearDependencies
	& AdminQueueDeliverDelayedDependencies
	& AdminQueueInboxDelayedDependencies
	& AdminQueueJobsDependencies
	& AdminQueuePauseDependencies
	& AdminQueuePromoteJobsDependencies
	& AdminQueueQueueStatsDependencies
	& AdminQueueQueuesDependencies
	& AdminQueueRemoveJobDependencies
	& AdminQueueResumeDependencies
	& AdminQueueRetryJobDependencies
	& AdminQueueShowJobLogsDependencies
	& AdminQueueShowJobDependencies
	& AdminQueueStatsDependencies
	& ResetDbDependencies;
