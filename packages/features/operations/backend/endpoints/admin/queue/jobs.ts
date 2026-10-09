/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { adminQueueJobsContract } from './jobs.contract.js';
import type { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import * as v from 'valibot';
export interface AdminQueueJobsDependencies {
	queueService: Pick<QueueService, 'queueGetJobs'>;
}
export function createAdminQueueJobsProcedure<Actor extends ApiActor>(deps: AdminQueueJobsDependencies) {
	return implement(adminQueueJobsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: adminQueueJobsContract['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'read:admin:queue' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			const result = await (async () => {
				return deps.queueService.queueGetJobs(ps.queue, ps.state, ps.search);
			})();
			return v.parse(adminQueueJobsContract['~orpc'].outputSchema!, result);
		});
}
