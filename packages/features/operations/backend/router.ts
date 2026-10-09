/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { OperationsApiContext } from './operations.js';
import { operationsApiContract } from './api.contract.js';
import { createAdminGetIndexStatsProcedure } from './endpoints/admin/get-index-stats.js';
import { createAdminGetTableStatsProcedure } from './endpoints/admin/get-table-stats.js';
import { createAdminQueueClearProcedure } from './endpoints/admin/queue/clear.js';
import { createAdminQueueDeliverDelayedProcedure } from './endpoints/admin/queue/deliver-delayed.js';
import { createAdminQueueInboxDelayedProcedure } from './endpoints/admin/queue/inbox-delayed.js';
import { createAdminQueueJobsProcedure } from './endpoints/admin/queue/jobs.js';
import { createAdminQueuePauseProcedure } from './endpoints/admin/queue/pause.js';
import { createAdminQueuePromoteJobsProcedure } from './endpoints/admin/queue/promote-jobs.js';
import { createAdminQueueQueueStatsProcedure } from './endpoints/admin/queue/queue-stats.js';
import { createAdminQueueQueuesProcedure } from './endpoints/admin/queue/queues.js';
import { createAdminQueueRemoveJobProcedure } from './endpoints/admin/queue/remove-job.js';
import { createAdminQueueResumeProcedure } from './endpoints/admin/queue/resume.js';
import { createAdminQueueRetryJobProcedure } from './endpoints/admin/queue/retry-job.js';
import { createAdminQueueShowJobLogsProcedure } from './endpoints/admin/queue/show-job-logs.js';
import { createAdminQueueShowJobProcedure } from './endpoints/admin/queue/show-job.js';
import { createAdminQueueStatsProcedure } from './endpoints/admin/queue/stats.js';
import { createResetDbProcedure } from './endpoints/reset-db.js';

export function createOperationsRouter<Actor extends ApiActor>() {
	return implement(operationsApiContract).$context<OperationsApiContext<Actor>>().router({
		adminGetIndexStats: createAdminGetIndexStatsProcedure<Actor>(),
		adminGetTableStats: createAdminGetTableStatsProcedure<Actor>(),
		adminQueueClear: createAdminQueueClearProcedure<Actor>(),
		adminQueueDeliverDelayed: createAdminQueueDeliverDelayedProcedure<Actor>(),
		adminQueueInboxDelayed: createAdminQueueInboxDelayedProcedure<Actor>(),
		adminQueueJobs: createAdminQueueJobsProcedure<Actor>(),
		adminQueuePause: createAdminQueuePauseProcedure<Actor>(),
		adminQueuePromoteJobs: createAdminQueuePromoteJobsProcedure<Actor>(),
		adminQueueQueueStats: createAdminQueueQueueStatsProcedure<Actor>(),
		adminQueueQueues: createAdminQueueQueuesProcedure<Actor>(),
		adminQueueRemoveJob: createAdminQueueRemoveJobProcedure<Actor>(),
		adminQueueResume: createAdminQueueResumeProcedure<Actor>(),
		adminQueueRetryJob: createAdminQueueRetryJobProcedure<Actor>(),
		adminQueueShowJobLogs: createAdminQueueShowJobLogsProcedure<Actor>(),
		adminQueueShowJob: createAdminQueueShowJobProcedure<Actor>(),
		adminQueueStats: createAdminQueueStatsProcedure<Actor>(),
		resetDb: createResetDbProcedure<Actor>(),
	});
}
