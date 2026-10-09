/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { adminQueueRemoveJobContract } from './remove-job.contract.js';
import type { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
export interface AdminQueueRemoveJobDependencies {
	queueService: Pick<QueueService, 'queueRemoveJob'>;
}
export function createAdminQueueRemoveJobProcedure<Actor extends ApiActor>(deps: AdminQueueRemoveJobDependencies) {
	return implement(adminQueueRemoveJobContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: adminQueueRemoveJobContract['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'write:admin:queue' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			void deps.queueService.queueRemoveJob(ps.queue, ps.jobId);
		});
}
