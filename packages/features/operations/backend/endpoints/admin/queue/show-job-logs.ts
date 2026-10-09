/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { adminQueueShowJobLogsContract } from './show-job-logs.contract.js';
import type { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import * as v from 'valibot';
export interface AdminQueueShowJobLogsDependencies {
	queueService: Pick<QueueService, 'queueGetJobLogs'>;
}
export function createAdminQueueShowJobLogsProcedure<Actor extends ApiActor>(deps: AdminQueueShowJobLogsDependencies) {
	return implement(adminQueueShowJobLogsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: adminQueueShowJobLogsContract['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'read:admin:queue' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			const result = await (async () => {
				return deps.queueService.queueGetJobLogs(ps.queue, ps.jobId);
			})();
			return v.parse(adminQueueShowJobLogsContract['~orpc'].outputSchema!, result);
		});
}
