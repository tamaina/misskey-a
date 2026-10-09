/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { adminQueueRetryJobContract } from './retry-job.contract.js';
import type { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
export interface AdminQueueRetryJobDependencies {
	queueService: Pick<QueueService, 'queueRetryJob'>;
}
export function createAdminQueueRetryJobProcedure<Actor extends ApiActor>(deps: AdminQueueRetryJobDependencies) {
	return implement(adminQueueRetryJobContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: adminQueueRetryJobContract['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'write:admin:queue' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			void deps.queueService.queueRetryJob(ps.queue, ps.jobId);
		});
}
