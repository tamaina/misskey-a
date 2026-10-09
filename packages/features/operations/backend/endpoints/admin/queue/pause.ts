/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { adminQueuePauseContract } from './pause.contract.js';
import type { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import type { ModerationLogService } from '../../../../../moderation/backend/services/ModerationLogService.js';
export interface AdminQueuePauseDependencies {
	queueService: Pick<QueueService, 'queuePause'>;
	moderationLogService: Pick<ModerationLogService, 'log'>;
}
export function createAdminQueuePauseProcedure<Actor extends ApiActor>(deps: AdminQueuePauseDependencies) {
	return createApiProcedure<Actor>()(adminQueuePauseContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			await deps.queueService.queuePause(ps.queue);
			void deps.moderationLogService.log(me, 'pauseQueue');
		});
}
