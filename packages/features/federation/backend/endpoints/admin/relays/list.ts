/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { adminRelaysListContract } from './list.contract.js';
import type { RelayService } from '../../../services/RelayService.js';
import * as v from 'valibot';
export interface AdminRelaysListDependencies {
	relayService: Pick<RelayService, 'listRelay'>;
}
export function createAdminRelaysListProcedure<Actor extends ApiActor>(deps: AdminRelaysListDependencies) {
	return implement(adminRelaysListContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: adminRelaysListContract['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'read:admin:relays' }))
		.use(requirePrincipal<Actor>())
		.handler(async () => {
			const result = await (async () => {
				return await deps.relayService.listRelay();
			})();
			return v.parse(adminRelaysListContract['~orpc'].outputSchema!, result);
		});
}
