/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { moderationContract } from '../../api.definition.js';
import type { ModerationApiDependencies } from '../../api.implementation.js';
export function createAdminUnsetUserAvatarProcedure<Actor extends ApiActor>(deps: Pick<ModerationApiDependencies<Actor>, 'usersRepository' | 'moderationLogService'>) {
	return implement(moderationContract.adminUnsetUserAvatar, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/unset-user-avatar', requireCredential: true, requireModerator: true, kind: 'write:admin:unset-user-avatar' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const user = await deps.usersRepository.findOneBy({ id: ps.userId });
			if (user == null) throw new Error('user not found');
			const fileId = user.avatarId;
			if (fileId == null) return;
			await deps.usersRepository.update(user.id, { avatar: null, avatarId: null, avatarUrl: null, avatarBlurhash: null });
			void deps.moderationLogService.log(me, 'unsetUserAvatar', { userId: user.id, userUsername: user.username, userHost: user.host, fileId });
		});
}
