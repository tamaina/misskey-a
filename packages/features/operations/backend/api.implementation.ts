/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as Redis from 'ioredis';
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
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { operationsApiContract } from './api.definition.js';
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
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DataSource } from 'typeorm';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import type { DeliverQueue, InboxQueue, DbQueue, ObjectStorageQueue } from '@features/boot/backend/assembly/QueueModule.js';
import { LoggerService } from '@features/runtime/backend/services/LoggerService.js';
import { MetaService } from '@features/instance/backend/services/MetaService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';

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

type OperationsRouter = ReturnType<typeof createOperationsRouter<MiLocalUser>>;

/** Compose once at root registration, after all domain initialization hooks. */
@Injectable()
export class OperationsApiProvider {
	private router: OperationsRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): OperationsRouter {
		if (this.router !== undefined) return this.router;
		this.router = createOperationsRouter<MiLocalUser>({
			db: this.moduleRef.get<DataSource>(DI.db, { strict: false }),
			queueService: this.moduleRef.get(QueueService, { strict: false }),
			moderationLogService: this.moduleRef.get(ModerationLogService, { strict: false }),
			deliverQueue: this.moduleRef.get<DeliverQueue>('queue:deliver', { strict: false }),
			inboxQueue: this.moduleRef.get<InboxQueue>('queue:inbox', { strict: false }),
			dbQueue: this.moduleRef.get<DbQueue>('queue:db', { strict: false }),
			objectStorageQueue: this.moduleRef.get<ObjectStorageQueue>('queue:objectStorage', { strict: false }),
			redisClient: this.moduleRef.get<Redis.Redis>(DI.redis, { strict: false }),
			loggerService: this.moduleRef.get(LoggerService, { strict: false }),
			metaService: this.moduleRef.get(MetaService, { strict: false }),
			globalEventService: this.moduleRef.get(GlobalEventService, { strict: false }),
		});
		return this.router;
	}
}
