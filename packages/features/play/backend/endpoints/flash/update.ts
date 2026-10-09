/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import { flashUpdateContract, flashUpdateErrors } from './update.contract.js';
import type { FlashsRepository } from '@features/persistence/backend/repositories/models.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface FlashUpdateDependencies {
	flashsRepository: Pick<FlashsRepository, 'findOneBy' | 'update'>;
}
export function createFlashUpdateProcedure(deps: FlashUpdateDependencies) {
	return implement(flashUpdateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: flashUpdateContract['~orpc'].meta.requestName, requireCredential: true, kind: 'write:flash', prohibitMoved: true, limit: { duration: 3_600_000, max: 300 } }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const flash = await deps.flashsRepository.findOneBy({ id: ps.flashId });
			if (flash == null) {
				throw apiError(flashUpdateErrors.noSuchFlash);
			}
			if (flash.userId !== me.id) {
				throw apiError(flashUpdateErrors.accessDenied);
			}
			await deps.flashsRepository.update(flash.id, {
				updatedAt: new Date(),
				...Object.fromEntries(
					Object.entries(ps).filter(
						([key, val]) => key !== 'flashId',
					),
				),
			});
		});
}
