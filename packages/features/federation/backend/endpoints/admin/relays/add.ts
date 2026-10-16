/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import { adminRelaysAddContract, adminRelaysAddErrors } from './add.contract.js';
import { URL } from 'node:url';
import type { RelayService } from '../../../services/RelayService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
export interface AdminRelaysAddDependencies {
	relayService: Pick<RelayService, 'addRelay'>;
}
export function createAdminRelaysAddProcedure<Actor extends ApiActor>(deps: AdminRelaysAddDependencies) {
	return createApiProcedure<Actor>()(adminRelaysAddContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			const result = await (async () => {
				try {
					if (new URL(ps.inbox).protocol !== 'https:') throw new Error('https only');
				} catch {
					throw apiError(adminRelaysAddErrors.invalidUrl);
				}
				const relay = await deps.relayService.addRelay(ps.inbox);
				return { id: relay.id, inbox: relay.inbox, status: relay.status };
			})();
			return result;
		});
}
