/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { adminQueueClearContract } from './clear.contract.js';
import type { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import type { ModerationLogService } from '../../../../../moderation/backend/services/ModerationLogService.js';
export interface AdminQueueClearDependencies {
	queueService: Pick<QueueService, 'queueClear'>;
	moderationLogService: Pick<ModerationLogService, 'log'>;
}
export function createAdminQueueClearProcedure<Actor extends ApiActor>(deps: AdminQueueClearDependencies) {
	return createApiProcedure<Actor>()(adminQueueClearContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			void deps.queueService.queueClear(ps.queue, ps.state);
			void deps.moderationLogService.log(me, 'clearQueue');
		});
}
