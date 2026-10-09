/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { OperationsApiContext } from '../../operations.js';
import { adminGetIndexStatsContract } from './get-index-stats.contract.js';

export function createAdminGetIndexStatsProcedure<Actor extends ApiActor>() {
	return implement(adminGetIndexStatsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<OperationsApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'admin/get-index-stats', requireCredential: true, requireAdmin: true, kind: 'read:admin:index-stats' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.operations.adminGetIndexStats(input, context.principal));
}
