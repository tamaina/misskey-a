/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { moderationContract } from '../../api.contract.js';
import type { ModerationApiDependencies } from '../../api.dependencies.js';
export function createAdminUnsuspendUserProcedure<Actor extends ApiActor>(deps: Pick<ModerationApiDependencies<Actor>, 'usersRepository' | 'userSuspendService'>) {
	return implement(moderationContract.adminUnsuspendUser, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/unsuspend-user', requireCredential: true, requireModerator: true, kind: 'write:admin:unsuspend-user' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const user = await deps.usersRepository.findOneBy({ id: ps.userId });
			if (user == null) throw new Error('user not found');
			await deps.userSuspendService.unsuspend(user, me);
		});
}
