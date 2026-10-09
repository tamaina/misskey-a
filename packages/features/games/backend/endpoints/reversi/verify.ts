/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import { reversiVerifyContract } from './verify.contract.js';
import type { ReversiService } from '../../services/ReversiService.js';
import type { ReversiGameEntityService } from '../../serializers/ReversiGameEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface ReversiVerifyDependencies {
	reversiService: Pick<ReversiService, 'checkCrc'>;
	reversiGameEntityService: Pick<ReversiGameEntityService, 'packDetail'>;
}
export function createReversiVerifyProcedure(deps: ReversiVerifyDependencies) {
	return implement(reversiVerifyContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: reversiVerifyContract['~orpc'].meta.requestName }))
		.handler(async ({ input: ps }) => {
			const game = await deps.reversiService.checkCrc(ps.gameId, ps.crc32);
			if (game) {
				return {
					desynced: true,
					game: await deps.reversiGameEntityService.packDetail(game),
				};
			} else {
				return {
					desynced: false,
				};
			}
		});
}
