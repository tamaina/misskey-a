/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedReversiGameDetailed } from '../../reversi.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

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
	return createApiProcedure<MiLocalUser>()(reversiShowGameContract)
		.handler(async ({ input: ps }) => {
			const game = await deps.reversiService.get(ps.gameId);
			if (game == null) {
				throw apiError(reversiShowGameErrors.noSuchGame);
			}
			return toPackedReversiGameDetailed(await deps.reversiGameEntityService.packDetail(game));
		});
}
