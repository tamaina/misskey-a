/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { reversiCancelMatchContract } from './cancel-match.contract.js';
import type { ReversiService } from '../../services/ReversiService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface ReversiCancelMatchDependencies {
	reversiService: Pick<ReversiService, 'matchAnyUserCancel' | 'matchSpecificUserCancel'>;
}
export function createReversiCancelMatchProcedure(deps: ReversiCancelMatchDependencies) {
	return createApiProcedure<MiLocalUser>()(reversiCancelMatchContract)
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
