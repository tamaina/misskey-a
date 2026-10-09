/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedReversiGameDetailed } from '../../reversi.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { reversiVerifyContract } from './verify.contract.js';
import type { ReversiService } from '../../services/ReversiService.js';
import type { ReversiGameEntityService } from '../../serializers/ReversiGameEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface ReversiVerifyDependencies {
	reversiService: Pick<ReversiService, 'checkCrc'>;
	reversiGameEntityService: Pick<ReversiGameEntityService, 'packDetail'>;
}
export function createReversiVerifyProcedure(deps: ReversiVerifyDependencies) {
	return createApiProcedure<MiLocalUser>()(reversiVerifyContract)
		.handler(async ({ input: ps }) => {
			const game = await deps.reversiService.checkCrc(ps.gameId, ps.crc32);
			if (game) {
				return {
					desynced: true,
					game: toPackedReversiGameDetailed(await deps.reversiGameEntityService.packDetail(game)),
				};
			} else {
				return {
					desynced: false,
				};
			}
		});
}
