/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { OperationsApiContext } from '../../../operations.js';
import { adminQueueClearContract } from './clear.contract.js';

export function createAdminQueueClearProcedure<Actor extends ApiActor>() {
	return implement(adminQueueClearContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<OperationsApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'admin/queue/clear', requireCredential: true, requireModerator: true, kind: 'write:admin:queue' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.operations.adminQueueClear(input, context.principal));
}
