/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import { flashUnlikeContract, flashUnlikeErrors } from './unlike.contract.js';
import type { FlashsRepository, FlashLikesRepository } from '@features/persistence/backend/repositories/models.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface FlashUnlikeDependencies {
	flashsRepository: Pick<FlashsRepository, 'decrement' | 'findOneBy'>;
	flashLikesRepository: Pick<FlashLikesRepository, 'delete' | 'findOneBy'>;
}
export function createFlashUnlikeProcedure(deps: FlashUnlikeDependencies) {
	return implement(flashUnlikeContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: flashUnlikeContract['~orpc'].meta.requestName, requireCredential: true, kind: 'write:flash-likes', prohibitMoved: true }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const flash = await deps.flashsRepository.findOneBy({ id: ps.flashId });
			if (flash == null) {
				throw apiError(flashUnlikeErrors.noSuchFlash);
			}
			const exist = await deps.flashLikesRepository.findOneBy({
				flashId: flash.id,
				userId: me.id,
			});
			if (exist == null) {
				throw apiError(flashUnlikeErrors.notLiked);
			}
			// Delete like
			await deps.flashLikesRepository.delete(exist.id);
			deps.flashsRepository.decrement({ id: flash.id }, 'likedCount', 1);
		});
}
