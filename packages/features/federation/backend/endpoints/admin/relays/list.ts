/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import { adminRelaysListContract } from './list.contract.js';
import type { RelayService } from '../../../services/RelayService.js';
export interface AdminRelaysListDependencies {
	relayService: Pick<RelayService, 'listRelay'>;
}
export function createAdminRelaysListProcedure<Actor extends ApiActor>(deps: AdminRelaysListDependencies) {
	return createApiProcedure<Actor>()(adminRelaysListContract)
		.use(requirePrincipal<Actor>())
		.handler(async () => {
			const result = await (async () => {
				return (await deps.relayService.listRelay()).map(relay => ({ id: relay.id, inbox: relay.inbox, status: relay.status }));
			})();
			return result;
		});
}
