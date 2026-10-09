/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { OperationsDependencies } from './api.dependencies.js';
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
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
export function createOperationsRouter<Actor extends ApiActor>(deps: OperationsDependencies) {
	return implement(operationsApiContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().router({
		adminGetIndexStats: createAdminGetIndexStatsProcedure<Actor>(deps),
		adminGetTableStats: createAdminGetTableStatsProcedure<Actor>(deps),
		adminQueueClear: createAdminQueueClearProcedure<Actor>(deps),
		adminQueueDeliverDelayed: createAdminQueueDeliverDelayedProcedure<Actor>(deps),
		adminQueueInboxDelayed: createAdminQueueInboxDelayedProcedure<Actor>(deps),
		adminQueueJobs: createAdminQueueJobsProcedure<Actor>(deps),
		adminQueuePause: createAdminQueuePauseProcedure<Actor>(deps),
		adminQueuePromoteJobs: createAdminQueuePromoteJobsProcedure<Actor>(deps),
		adminQueueQueueStats: createAdminQueueQueueStatsProcedure<Actor>(deps),
		adminQueueQueues: createAdminQueueQueuesProcedure<Actor>(deps),
		adminQueueRemoveJob: createAdminQueueRemoveJobProcedure<Actor>(deps),
		adminQueueResume: createAdminQueueResumeProcedure<Actor>(deps),
		adminQueueRetryJob: createAdminQueueRetryJobProcedure<Actor>(deps),
		adminQueueShowJobLogs: createAdminQueueShowJobLogsProcedure<Actor>(deps),
		adminQueueShowJob: createAdminQueueShowJobProcedure<Actor>(deps),
		adminQueueStats: createAdminQueueStatsProcedure<Actor>(deps),
		resetDb: createResetDbProcedure<Actor>(deps),
	});
}
