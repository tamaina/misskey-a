/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { adminQueueQueueStatsContract } from './queue-stats.contract.js';
import type { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import * as v from 'valibot';
export interface AdminQueueQueueStatsDependencies {
	queueService: Pick<QueueService, 'queueGetQueue'>;
}
export function createAdminQueueQueueStatsProcedure<Actor extends ApiActor>(deps: AdminQueueQueueStatsDependencies) {
	return implement(adminQueueQueueStatsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: adminQueueQueueStatsContract['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'read:admin:queue' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			const result = await (async () => {
				return deps.queueService.queueGetQueue(ps.queue);
			})();
			return v.parse(adminQueueQueueStatsContract['~orpc'].outputSchema!, result);
		});
}
