/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { OperationsApiContext } from '../../operations.js';
import { adminGetTableStatsContract } from './get-table-stats.contract.js';

export function createAdminGetTableStatsProcedure<Actor extends ApiActor>() {
	return implement(adminGetTableStatsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<OperationsApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'admin/get-table-stats', requireCredential: true, requireAdmin: true, kind: 'read:admin:table-stats' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.operations.adminGetTableStats(input, context.principal));
}
