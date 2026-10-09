/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { adminQueueRetryJobContract } from './retry-job.contract.js';
import type { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
export interface AdminQueueRetryJobDependencies {
	queueService: Pick<QueueService, 'queueRetryJob'>;
}
export function createAdminQueueRetryJobProcedure<Actor extends ApiActor>(deps: AdminQueueRetryJobDependencies) {
	return createApiProcedure<Actor>()(adminQueueRetryJobContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			void deps.queueService.queueRetryJob(ps.queue, ps.jobId);
		});
}
