/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { adminQueueInboxDelayedContract } from './inbox-delayed.contract.js';
import { getInboxJobHost } from '@features/federation/backend/utility/inbox-job-signature.js';
import type { InboxQueue } from '../../../../../boot/backend/assembly/QueueModule.js';
export interface AdminQueueInboxDelayedDependencies {
	inboxQueue: Pick<InboxQueue, 'getJobs'>;
}
export function createAdminQueueInboxDelayedProcedure<Actor extends ApiActor>(deps: AdminQueueInboxDelayedDependencies) {
	return createApiProcedure<Actor>()(adminQueueInboxDelayedContract)
		.use(requirePrincipal<Actor>())
		.handler(async () => {
			const result = await (async () => {
				const jobs = await deps.inboxQueue.getJobs(['delayed']);
				const counts = new Map<string, number>();
				for (const job of jobs) {
					const host = getInboxJobHost(job.data);
					counts.set(host, (counts.get(host) ?? 0) + 1);
				}
				const res = [...counts.entries()].sort((a, b) => b[1] - a[1]);
				return res;
			})();
			return result;
		});
}
