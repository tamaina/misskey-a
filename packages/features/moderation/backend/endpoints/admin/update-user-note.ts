/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { moderationContract } from '../../api.definition.js';
import type { ModerationApiDependencies } from '../../api.implementation.js';
export function createAdminUpdateUserNoteProcedure<Actor extends ApiActor>(deps: Pick<ModerationApiDependencies<Actor>, 'usersRepository' | 'userProfilesRepository' | 'moderationLogService'>) {
	return createApiProcedure<Actor>()(moderationContract.adminUpdateUserNote).use(requirePrincipal<Actor>())
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
