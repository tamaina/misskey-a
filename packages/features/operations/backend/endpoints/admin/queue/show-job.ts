/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { OperationsApiContext } from '../../../operations.js';
import { adminQueueShowJobContract } from './show-job.contract.js';

export function createAdminQueueShowJobProcedure<Actor extends ApiActor>() {
	return implement(adminQueueShowJobContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<OperationsApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'admin/queue/show-job', requireCredential: true, requireModerator: true, kind: 'read:admin:queue' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.operations.adminQueueShowJob(input, context.principal));
}
