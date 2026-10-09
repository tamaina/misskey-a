/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { UsersInputs } from '../../api.contract.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { usersAchievementsContract } from './achievements.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface UsersAchievementsDependencies {
	userProfilesRepository: UserProfilesRepository;
}
export function createUsersAchievementsProcedure(deps: UsersAchievementsDependencies) {
	async function execute(ps: UsersInputs['users/achievements'], _me: MiLocalUser | null, _token: ApiToken | null, _ip: string) {
		const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: ps.userId });

		return profile.achievements;
	}

	return implement(usersAchievementsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: usersAchievementsContract['~orpc'].meta.requestName }))
		.handler(async ({ input, context }) => await execute(input, context.principal, context.token, context.ip));
}
