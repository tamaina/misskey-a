/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { requirePrincipal } from '../../../../api/backend/transport/middleware.js';

import { flashUnlikeContract, flashUnlikeErrors } from './unlike.contract.js';
import type { FlashsRepository, FlashLikesRepository } from '@features/persistence/backend/repositories/models.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface FlashUnlikeDependencies {
	flashsRepository: Pick<FlashsRepository, 'decrement' | 'findOneBy'>;
	flashLikesRepository: Pick<FlashLikesRepository, 'delete' | 'findOneBy'>;
}
export function createFlashUnlikeProcedure(deps: FlashUnlikeDependencies) {
	return createApiProcedure<MiLocalUser>()(flashUnlikeContract)
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
