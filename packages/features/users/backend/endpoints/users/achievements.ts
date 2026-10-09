/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { UsersInputs } from '../../api.definition.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { usersAchievementsContract } from './achievements.contract.js';

export interface UsersAchievementsDependencies {
	userProfilesRepository: UserProfilesRepository;
}
export function createUsersAchievementsProcedure(deps: UsersAchievementsDependencies) {
	async function execute(ps: UsersInputs['users/achievements'], _me: MiLocalUser | null, _token: ApiToken | null, _ip: string) {
		const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: ps.userId });

		return profile.achievements.map(achievement => ({ name: achievement.name, unlockedAt: achievement.unlockedAt }));
	}

	return createApiProcedure<MiLocalUser>()(usersAchievementsContract)
		.handler(async ({ input, context }) => await execute(input, context.principal, context.token, context.ip));
}
