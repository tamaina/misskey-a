/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { adminQueueQueueStatsContract } from './queue-stats.contract.js';
import type { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import { toQueueDetails } from '../../../queue-wire.js';
export interface AdminQueueQueueStatsDependencies {
	queueService: Pick<QueueService, 'queueGetQueue'>;
}
export function createAdminQueueQueueStatsProcedure<Actor extends ApiActor>(deps: AdminQueueQueueStatsDependencies) {
	return createApiProcedure<Actor>()(adminQueueQueueStatsContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			const result = await (async () => {
				return deps.queueService.queueGetQueue(ps.queue);
			})();
			return toQueueDetails(result);
		});
}
