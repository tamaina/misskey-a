/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import { adminRelaysRemoveContract } from './remove.contract.js';
import type { RelayService } from '../../../services/RelayService.js';
export interface AdminRelaysRemoveDependencies {
	relayService: Pick<RelayService, 'removeRelay'>;
}
export function createAdminRelaysRemoveProcedure<Actor extends ApiActor>(deps: AdminRelaysRemoveDependencies) {
	return createApiProcedure<Actor>()(adminRelaysRemoveContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			const result = await (async () => {
				return await deps.relayService.removeRelay(ps.inbox);
			})();
			return result;
		});
}
