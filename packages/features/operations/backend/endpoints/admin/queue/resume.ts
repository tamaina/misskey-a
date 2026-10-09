/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { adminQueueResumeContract } from './resume.contract.js';
import type { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import type { ModerationLogService } from '../../../../../moderation/backend/services/ModerationLogService.js';
export interface AdminQueueResumeDependencies {
	queueService: Pick<QueueService, 'queueResume'>;
	moderationLogService: Pick<ModerationLogService, 'log'>;
}
export function createAdminQueueResumeProcedure<Actor extends ApiActor>(deps: AdminQueueResumeDependencies) {
	return implement(adminQueueResumeContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: adminQueueResumeContract['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'write:admin:queue' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			await deps.queueService.queueResume(ps.queue);
			void deps.moderationLogService.log(me, 'resumeQueue');
		});
}
