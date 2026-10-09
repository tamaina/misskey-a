/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { OperationsApiContext } from '../../../operations.js';
import { adminQueuePauseContract } from './pause.contract.js';

export function createAdminQueuePauseProcedure<Actor extends ApiActor>() {
	return implement(adminQueuePauseContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<OperationsApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'admin/queue/pause', requireCredential: true, requireModerator: true, kind: 'write:admin:queue' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.operations.adminQueuePause(input, context.principal));
}
