/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { adminQueueShowJobContract } from './show-job.contract.js';
import type { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import { toQueueJob } from '../../../queue-wire.js';
export interface AdminQueueShowJobDependencies {
	queueService: Pick<QueueService, 'queueGetJob'>;
}
export function createAdminQueueShowJobProcedure<Actor extends ApiActor>(deps: AdminQueueShowJobDependencies) {
	return createApiProcedure<Actor>()(adminQueueShowJobContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			const result = await (async () => {
				return deps.queueService.queueGetJob(ps.queue, ps.jobId);
			})();
			return toQueueJob(result);
		});
}
