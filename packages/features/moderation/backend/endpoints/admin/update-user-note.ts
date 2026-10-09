/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { moderationContract } from '../../api.contract.js';
import type { ModerationApiDependencies } from '../../api.dependencies.js';
export function createAdminUpdateUserNoteProcedure<Actor extends ApiActor>(deps: Pick<ModerationApiDependencies<Actor>, 'usersRepository' | 'userProfilesRepository' | 'moderationLogService'>) {
	return implement(moderationContract.adminUpdateUserNote, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/update-user-note', requireCredential: true, requireModerator: true, kind: 'write:admin:user-note' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const user = await deps.usersRepository.findOneBy({ id: ps.userId });
			if (user == null) throw new Error('user not found');
			const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: user.id });
			await deps.userProfilesRepository.update({ userId: user.id }, { moderationNote: ps.text });
			void deps.moderationLogService.log(me, 'updateUserNote', { userId: user.id, userUsername: user.username, userHost: user.host, before: profile.moderationNote, after: ps.text });
		});
}
