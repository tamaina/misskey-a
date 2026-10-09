/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import { bubbleGameRegisterContract, bubbleGameRegisterErrors } from './register.contract.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { BubbleGameRecordsRepository } from '@features/persistence/backend/repositories/models.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface BubbleGameRegisterDependencies {
	bubbleGameRecordsRepository: Pick<BubbleGameRecordsRepository, 'insert'>;
	idService: Pick<IdService, 'gen'>;
}
export function createBubbleGameRegisterProcedure(deps: BubbleGameRegisterDependencies) {
	return implement(bubbleGameRegisterContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: bubbleGameRegisterContract['~orpc'].meta.requestName, requireCredential: true, kind: 'write:account', limit: { duration: 3_600_000, max: 120, minInterval: 30_000 } }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const seedDate = new Date(parseInt(ps.seed, 10));
			const now = new Date();
			// シードが未来なのは通常のプレイではありえないので弾く
			if (seedDate.getTime() > now.getTime()) {
				throw apiError(bubbleGameRegisterErrors.invalidSeed);
			}
			// シードが古すぎる(5時間以上前)のも弾く
			if (seedDate.getTime() < now.getTime() - 1000 * 60 * 60 * 5) {
				throw apiError(bubbleGameRegisterErrors.invalidSeed);
			}
			await deps.bubbleGameRecordsRepository.insert({
				id: deps.idService.gen(now.getTime()),
				seed: ps.seed,
				seededAt: seedDate,
				userId: me.id,
				score: ps.score,
				logs: ps.logs,
				gameMode: ps.gameMode,
				gameVersion: ps.gameVersion,
				isVerified: false,
			});
		});
}
