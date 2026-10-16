/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { adminQueueQueuesContract } from './queues.contract.js';
import type { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import { toQueueOverview } from '../../../queue-wire.js';
export interface AdminQueueQueuesDependencies {
	queueService: Pick<QueueService, 'queueGetQueues'>;
}
export function createAdminQueueQueuesProcedure<Actor extends ApiActor>(deps: AdminQueueQueuesDependencies) {
	return createApiProcedure<Actor>()(adminQueueQueuesContract)
		.use(requirePrincipal<Actor>())
		.handler(async () => {
			const result = await (async () => {
				return deps.queueService.queueGetQueues();
			})();
			return result.map(toQueueOverview);
		});
}
