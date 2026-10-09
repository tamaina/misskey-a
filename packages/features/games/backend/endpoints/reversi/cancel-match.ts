/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import { reversiCancelMatchContract } from './cancel-match.contract.js';
import type { ReversiService } from '../../services/ReversiService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface ReversiCancelMatchDependencies {
	reversiService: Pick<ReversiService, 'matchAnyUserCancel' | 'matchSpecificUserCancel'>;
}
export function createReversiCancelMatchProcedure(deps: ReversiCancelMatchDependencies) {
	return implement(reversiCancelMatchContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: reversiCancelMatchContract['~orpc'].meta.requestName, requireCredential: true, kind: 'write:account' }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			if (ps.userId) {
				await deps.reversiService.matchSpecificUserCancel(me, ps.userId);
				return;
			} else {
				await deps.reversiService.matchAnyUserCancel(me);
			}
		});
}
