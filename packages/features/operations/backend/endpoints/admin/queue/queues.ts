/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { adminQueueQueuesContract } from './queues.contract.js';
import type { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import * as v from 'valibot';
export interface AdminQueueQueuesDependencies {
	queueService: Pick<QueueService, 'queueGetQueues'>;
}
export function createAdminQueueQueuesProcedure<Actor extends ApiActor>(deps: AdminQueueQueuesDependencies) {
	return implement(adminQueueQueuesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: adminQueueQueuesContract['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'read:admin:queue' }))
		.use(requirePrincipal<Actor>())
		.handler(async () => {
			const result = await (async () => {
				return deps.queueService.queueGetQueues();
			})();
			return v.parse(adminQueueQueuesContract['~orpc'].outputSchema!, result);
		});
}
