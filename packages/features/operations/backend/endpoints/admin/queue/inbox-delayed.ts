/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { adminQueueInboxDelayedContract } from './inbox-delayed.contract.js';
import { URL } from 'node:url';
import type { InboxQueue } from '../../../../../boot/backend/assembly/QueueModule.js';
import * as v from 'valibot';
export interface AdminQueueInboxDelayedDependencies {
	inboxQueue: Pick<InboxQueue, 'getJobs'>;
}
export function createAdminQueueInboxDelayedProcedure<Actor extends ApiActor>(deps: AdminQueueInboxDelayedDependencies) {
	return implement(adminQueueInboxDelayedContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: adminQueueInboxDelayedContract['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'read:admin:queue' }))
		.use(requirePrincipal<Actor>())
		.handler(async () => {
			const result = await (async () => {
				const jobs = await deps.inboxQueue.getJobs(['delayed']);
				const counts = new Map<string, number>();
				for (const job of jobs) {
					const host = new URL(job.data.signature.keyId).host;
					counts.set(host, (counts.get(host) ?? 0) + 1);
				}
				const res = [...counts.entries()].sort((a, b) => b[1] - a[1]);
				return res;
			})();
			return v.parse(adminQueueInboxDelayedContract['~orpc'].outputSchema!, result);
		});
}
