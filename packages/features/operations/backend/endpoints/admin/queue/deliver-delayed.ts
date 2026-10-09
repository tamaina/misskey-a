/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { adminQueueDeliverDelayedContract } from './deliver-delayed.contract.js';
import { URL } from 'node:url';
import type { DeliverQueue } from '../../../../../boot/backend/assembly/QueueModule.js';
export interface AdminQueueDeliverDelayedDependencies {
	deliverQueue: Pick<DeliverQueue, 'getJobs'>;
}
export function createAdminQueueDeliverDelayedProcedure<Actor extends ApiActor>(deps: AdminQueueDeliverDelayedDependencies) {
	return createApiProcedure<Actor>()(adminQueueDeliverDelayedContract)
		.use(requirePrincipal<Actor>())
		.handler(async () => {
			const result = await (async () => {
				const jobs = await deps.deliverQueue.getJobs(['delayed']);
				const counts = new Map<string, number>();
				for (const job of jobs) {
					const host = new URL(job.data.to).host;
					counts.set(host, (counts.get(host) ?? 0) + 1);
				}
				const res = [...counts.entries()].sort((a, b) => b[1] - a[1]);
				return res;
			})();
			return result;
		});
}
