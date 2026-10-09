/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { moderationContract } from '../../api.definition.js';
import type { ModerationApiDependencies } from '../../api.implementation.js';
export function createAdminUnsetUserBannerProcedure<Actor extends ApiActor>(deps: Pick<ModerationApiDependencies<Actor>, 'usersRepository' | 'moderationLogService'>) {
	return implement(moderationContract.adminUnsetUserBanner, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/unset-user-banner', requireCredential: true, requireModerator: true, kind: 'write:admin:unset-user-banner' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const user = await deps.usersRepository.findOneBy({ id: ps.userId });
			if (user == null) throw new Error('user not found');
			const fileId = user.bannerId;
			if (fileId == null) return;
			await deps.usersRepository.update(user.id, { banner: null, bannerId: null, bannerUrl: null, bannerBlurhash: null });
			void deps.moderationLogService.log(me, 'unsetUserBanner', { userId: user.id, userUsername: user.username, userHost: user.host, fileId });
		});
}
