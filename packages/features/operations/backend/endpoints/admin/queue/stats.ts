/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { adminQueueStatsContract } from './stats.contract.js';
import type { DbQueue, DeliverQueue, InboxQueue, ObjectStorageQueue } from '../../../../../boot/backend/assembly/QueueModule.js';
import * as v from 'valibot';
export interface AdminQueueStatsDependencies {
	deliverQueue: Pick<DeliverQueue, 'getJobCounts'>;
	inboxQueue: Pick<InboxQueue, 'getJobCounts'>;
	dbQueue: Pick<DbQueue, 'getJobCounts'>;
	objectStorageQueue: Pick<ObjectStorageQueue, 'getJobCounts'>;
}
export function createAdminQueueStatsProcedure<Actor extends ApiActor>(deps: AdminQueueStatsDependencies) {
	return implement(adminQueueStatsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: adminQueueStatsContract['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'read:admin:queue' }))
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
			return v.parse(adminQueueStatsContract['~orpc'].outputSchema!, result);
		});
}
