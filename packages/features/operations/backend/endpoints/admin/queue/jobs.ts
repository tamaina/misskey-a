/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { adminQueueJobsContract } from './jobs.contract.js';
import type { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import { toQueueJob } from '../../../queue-wire.js';
export interface AdminQueueJobsDependencies {
	queueService: Pick<QueueService, 'queueGetJobs'>;
}
export function createAdminQueueJobsProcedure<Actor extends ApiActor>(deps: AdminQueueJobsDependencies) {
	return createApiProcedure<Actor>()(adminQueueJobsContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			const result = await (async () => {
				return deps.queueService.queueGetJobs(ps.queue, ps.state, ps.search);
			})();
			return result.map(toQueueJob);
		});
}
