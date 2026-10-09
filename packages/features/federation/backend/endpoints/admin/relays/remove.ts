/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { adminRelaysRemoveContract } from './remove.contract.js';
import type { RelayService } from '../../../services/RelayService.js';
import * as v from 'valibot';
export interface AdminRelaysRemoveDependencies {
	relayService: Pick<RelayService, 'removeRelay'>;
}
export function createAdminRelaysRemoveProcedure<Actor extends ApiActor>(deps: AdminRelaysRemoveDependencies) {
	return implement(adminRelaysRemoveContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: adminRelaysRemoveContract['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'write:admin:relays' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			const result = await (async () => {
				return await deps.relayService.removeRelay(ps.inbox);
			})();
			return v.parse(adminRelaysRemoveContract['~orpc'].outputSchema!, result);
		});
}
