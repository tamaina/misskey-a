/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { type AchievementService } from '../../services/AchievementService.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { UsersInputs } from '../../api.definition.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { iClaimAchievementContract } from './claim-achievement.contract.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface IClaimAchievementDependencies {
	achievementService: AchievementService;
}
export function createIClaimAchievementProcedure(deps: IClaimAchievementDependencies) {
	async function execute(ps: UsersInputs['i/claim-achievement'], me: MiLocalUser, _token: ApiToken | null, _ip: string) {
		await deps.achievementService.create(me.id, ps.name);
	}

	return createApiProcedure<MiLocalUser>()(iClaimAchievementContract).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => await execute(input, context.principal, context.token, context.ip));
}
