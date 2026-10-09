/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { adminRelaysAddContract, adminRelaysAddErrors } from './add.contract.js';
import { URL } from 'node:url';
import type { RelayService } from '../../../services/RelayService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import * as v from 'valibot';
export interface AdminRelaysAddDependencies {
	relayService: Pick<RelayService, 'addRelay'>;
}
export function createAdminRelaysAddProcedure<Actor extends ApiActor>(deps: AdminRelaysAddDependencies) {
	return implement(adminRelaysAddContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: adminRelaysAddContract['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'write:admin:relays' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			const result = await (async () => {
				try {
					if (new URL(ps.inbox).protocol !== 'https:') throw new Error('https only');
				} catch {
					throw apiError(adminRelaysAddErrors.invalidUrl);
				}
				return await deps.relayService.addRelay(ps.inbox);
			})();
			return v.parse(adminRelaysAddContract['~orpc'].outputSchema!, result);
		});
}
