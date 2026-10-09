/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import { flashDeleteContract, flashDeleteErrors } from './delete.contract.js';
import type { FlashsRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import type { RoleService } from '@features/roles/backend/services/RoleService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface FlashDeleteDependencies {
	flashsRepository: Pick<FlashsRepository, 'delete' | 'findOneBy'>;
	usersRepository: Pick<UsersRepository, 'findOneByOrFail'>;
	moderationLogService: Pick<ModerationLogService, 'log'>;
	roleService: Pick<RoleService, 'isModerator'>;
}
export function createFlashDeleteProcedure(deps: FlashDeleteDependencies) {
	return implement(flashDeleteContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: flashDeleteContract['~orpc'].meta.requestName, requireCredential: true, kind: 'write:flash' }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const flash = await deps.flashsRepository.findOneBy({ id: ps.flashId });
			if (flash == null) {
				throw apiError(flashDeleteErrors.noSuchFlash);
			}
			if (!await deps.roleService.isModerator(me) && flash.userId !== me.id) {
				throw apiError(flashDeleteErrors.accessDenied);
			}
			await deps.flashsRepository.delete(flash.id);
			if (flash.userId !== me.id) {
				const user = await deps.usersRepository.findOneByOrFail({ id: flash.userId });
				deps.moderationLogService.log(me, 'deleteFlash', {
					flashId: flash.id,
					flashUserId: flash.userId,
					flashUserUsername: user.username,
					flash,
				});
			}
		});
}
