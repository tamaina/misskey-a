/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { adminQueueStatsContract } from './stats.contract.js';
import type { DbQueue, DeliverQueue, InboxQueue, ObjectStorageQueue } from '../../../../../boot/backend/assembly/QueueModule.js';
import { toQueueCounts } from '../../../queue-wire.js';
export interface AdminQueueStatsDependencies {
	deliverQueue: Pick<DeliverQueue, 'getJobCounts'>;
	inboxQueue: Pick<InboxQueue, 'getJobCounts'>;
	dbQueue: Pick<DbQueue, 'getJobCounts'>;
	objectStorageQueue: Pick<ObjectStorageQueue, 'getJobCounts'>;
}
export function createAdminQueueStatsProcedure<Actor extends ApiActor>(deps: AdminQueueStatsDependencies) {
	return createApiProcedure<Actor>()(adminQueueStatsContract)
		.use(requirePrincipal<Actor>())
		.handler(async () => {
			const result = await (async () => {
				const deliverJobCounts = await deps.deliverQueue.getJobCounts();
				const inboxJobCounts = await deps.inboxQueue.getJobCounts();
				const dbJobCounts = await deps.dbQueue.getJobCounts();
				const objectStorageJobCounts = await deps.objectStorageQueue.getJobCounts();
				return {
					deliver: deliverJobCounts,
					inbox: inboxJobCounts,
					db: dbJobCounts,
					objectStorage: objectStorageJobCounts,
				};
			})();
			return { deliver: toQueueCounts(result.deliver), inbox: toQueueCounts(result.inbox), db: toQueueCounts(result.db), objectStorage: toQueueCounts(result.objectStorage) };
		});
}
