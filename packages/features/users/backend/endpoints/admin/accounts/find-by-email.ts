/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { type UserEntityService } from '../../../serializers/UserEntityService.js';
import { adminAccountsFindByEmailErrors } from './find-by-email.contract.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { UsersInputs } from '../../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { adminAccountsFindByEmailContract } from './find-by-email.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
export interface AdminAccountsFindByEmailDependencies {
	userProfilesRepository: UserProfilesRepository;
	userEntityService: UserEntityService;
}
export function createAdminAccountsFindByEmailProcedure(deps: AdminAccountsFindByEmailDependencies) {
	async function execute(ps: UsersInputs['admin/accounts/find-by-email'], _me: MiLocalUser, _token: ApiToken | null, _ip: string) {
		const profile = await deps.userProfilesRepository.findOne({
			where: { email: ps.email },
			relations: { user: true },
		});

		if (profile == null || profile.user === null) {
			throw apiError(adminAccountsFindByEmailErrors.userNotFound);
		}

		const res = await deps.userEntityService.pack(profile.user, null, {
			schema: 'UserDetailedNotMe',
		});

		return res;
	}

	return implement(adminAccountsFindByEmailContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: adminAccountsFindByEmailContract['~orpc'].meta.requestName, requireCredential: true, requireAdmin: true, kind: 'read:admin:account' })).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => toPackedUserDetailed(await execute(input, context.principal, context.token, context.ip)));
}
