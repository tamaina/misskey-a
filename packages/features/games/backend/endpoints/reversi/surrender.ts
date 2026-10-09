/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import { reversiSurrenderContract, reversiSurrenderErrors } from './surrender.contract.js';
import type { ReversiService } from '../../services/ReversiService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface ReversiSurrenderDependencies {
	reversiService: Pick<ReversiService, 'get' | 'surrender'>;
}
export function createReversiSurrenderProcedure(deps: ReversiSurrenderDependencies) {
	return implement(reversiSurrenderContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: reversiSurrenderContract['~orpc'].meta.requestName, requireCredential: true, kind: 'write:account' }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const game = await deps.reversiService.get(ps.gameId);
			if (game == null) {
				throw apiError(reversiSurrenderErrors.noSuchGame);
			}
			if (game.isEnded) {
				throw apiError(reversiSurrenderErrors.alreadyEnded);
			}
			if ((game.user1Id !== me.id) && (game.user2Id !== me.id)) {
				throw apiError(reversiSurrenderErrors.accessDenied);
			}
			await deps.reversiService.surrender(game.id, me);
		});
}
