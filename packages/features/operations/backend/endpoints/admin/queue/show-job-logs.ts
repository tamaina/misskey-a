/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { adminQueueShowJobLogsContract } from './show-job-logs.contract.js';
import type { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
export interface AdminQueueShowJobLogsDependencies {
	queueService: Pick<QueueService, 'queueGetJobLogs'>;
}
export function createAdminQueueShowJobLogsProcedure<Actor extends ApiActor>(deps: AdminQueueShowJobLogsDependencies) {
	return createApiProcedure<Actor>()(adminQueueShowJobLogsContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			const result = await (async () => {
				return deps.queueService.queueGetJobLogs(ps.queue, ps.jobId);
			})();
			return [...result];
		});
}
