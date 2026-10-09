/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { adminQueueRemoveJobContract } from './remove-job.contract.js';
import type { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
export interface AdminQueueRemoveJobDependencies {
	queueService: Pick<QueueService, 'queueRemoveJob'>;
}
export function createAdminQueueRemoveJobProcedure<Actor extends ApiActor>(deps: AdminQueueRemoveJobDependencies) {
	return createApiProcedure<Actor>()(adminQueueRemoveJobContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			void deps.queueService.queueRemoveJob(ps.queue, ps.jobId);
		});
}
