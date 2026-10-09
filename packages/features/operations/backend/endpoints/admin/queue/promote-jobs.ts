/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { adminQueuePromoteJobsContract } from './promote-jobs.contract.js';
import type { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import type { ModerationLogService } from '../../../../../moderation/backend/services/ModerationLogService.js';
export interface AdminQueuePromoteJobsDependencies {
	queueService: Pick<QueueService, 'queuePromoteJobs'>;
	moderationLogService: Pick<ModerationLogService, 'log'>;
}
export function createAdminQueuePromoteJobsProcedure<Actor extends ApiActor>(deps: AdminQueuePromoteJobsDependencies) {
	return implement(adminQueuePromoteJobsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: adminQueuePromoteJobsContract['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'write:admin:queue' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			void deps.queueService.queuePromoteJobs(ps.queue);
			void deps.moderationLogService.log(me, 'promoteQueue');
		});
}
