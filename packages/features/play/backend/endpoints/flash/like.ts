/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { requirePrincipal } from '../../../../api/backend/transport/middleware.js';

import { flashLikeContract, flashLikeErrors } from './like.contract.js';
import type { FlashsRepository, FlashLikesRepository } from '@features/persistence/backend/repositories/models.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface FlashLikeDependencies {
	flashsRepository: Pick<FlashsRepository, 'findOneBy' | 'increment'>;
	flashLikesRepository: Pick<FlashLikesRepository, 'exists' | 'insert'>;
	idService: Pick<IdService, 'gen'>;
}
export function createFlashLikeProcedure(deps: FlashLikeDependencies) {
	return createApiProcedure<MiLocalUser>()(flashLikeContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const flash = await deps.flashsRepository.findOneBy({ id: ps.flashId });
			if (flash == null) {
				throw apiError(flashLikeErrors.noSuchFlash);
			}
			if (flash.userId === me.id) {
				throw apiError(flashLikeErrors.yourFlash);
			}
			// if already liked
			const exist = await deps.flashLikesRepository.exists({
				where: {
					flashId: flash.id,
					userId: me.id,
				},
			});
			if (exist) {
				throw apiError(flashLikeErrors.alreadyLiked);
			}
			// Create like
			await deps.flashLikesRepository.insert({
				id: deps.idService.gen(),
				flashId: flash.id,
				userId: me.id,
			});
			deps.flashsRepository.increment({ id: flash.id }, 'likedCount', 1);
		});
}
