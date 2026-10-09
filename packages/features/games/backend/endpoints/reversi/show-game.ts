/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import { reversiShowGameContract, reversiShowGameErrors } from './show-game.contract.js';
import type { ReversiService } from '../../services/ReversiService.js';
import type { ReversiGameEntityService } from '../../serializers/ReversiGameEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface ReversiShowGameDependencies {
	reversiService: Pick<ReversiService, 'get'>;
	reversiGameEntityService: Pick<ReversiGameEntityService, 'packDetail'>;
}
export function createReversiShowGameProcedure(deps: ReversiShowGameDependencies) {
	return implement(reversiShowGameContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: reversiShowGameContract['~orpc'].meta.requestName }))
		.handler(async ({ input: ps }) => {
			const game = await deps.reversiService.get(ps.gameId);
			if (game == null) {
				throw apiError(reversiShowGameErrors.noSuchGame);
			}
			return await deps.reversiGameEntityService.packDetail(game);
		});
}
