/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { adminQueuePauseContract } from './pause.contract.js';
import type { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import type { ModerationLogService } from '../../../../../moderation/backend/services/ModerationLogService.js';
export interface AdminQueuePauseDependencies {
	queueService: Pick<QueueService, 'queuePause'>;
	moderationLogService: Pick<ModerationLogService, 'log'>;
}
export function createAdminQueuePauseProcedure<Actor extends ApiActor>(deps: AdminQueuePauseDependencies) {
	return implement(adminQueuePauseContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: adminQueuePauseContract['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'write:admin:queue' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			await deps.queueService.queuePause(ps.queue);
			void deps.moderationLogService.log(me, 'pauseQueue');
		});
}
