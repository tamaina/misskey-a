/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { adminQueueShowJobContract } from './show-job.contract.js';
import type { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import * as v from 'valibot';
export interface AdminQueueShowJobDependencies {
	queueService: Pick<QueueService, 'queueGetJob'>;
}
export function createAdminQueueShowJobProcedure<Actor extends ApiActor>(deps: AdminQueueShowJobDependencies) {
	return implement(adminQueueShowJobContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: adminQueueShowJobContract['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'read:admin:queue' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			const result = await (async () => {
				return deps.queueService.queueGetJob(ps.queue, ps.jobId);
			})();
			return v.parse(adminQueueShowJobContract['~orpc'].outputSchema!, result);
		});
}
