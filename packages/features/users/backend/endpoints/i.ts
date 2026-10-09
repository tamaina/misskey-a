/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { type UserEntityService } from '../serializers/UserEntityService.js';
import { iErrors } from './i.contract.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { UsersInputs } from '../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { iContract } from './i.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
export interface IDependencies {
	userProfilesRepository: UserProfilesRepository;
	userEntityService: UserEntityService;
}
export function createIProcedure(deps: IDependencies) {
	async function execute(_ps: UsersInputs['i'], user: MiLocalUser, token: ApiToken | null, _ip: string) {
		const isSecure = token == null;

		const now = new Date();
		const today = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;

		// 渡ってきている user はキャッシュされていて古い可能性があるので改めて取得
		const userProfile = await deps.userProfilesRepository.findOne({
			where: {
				userId: user.id,
			},
			relations: { user: true },
		});

		if (userProfile == null || userProfile.user === null) {
			throw apiError(iErrors.userIsDeleted);
		}

		if (!userProfile.loggedInDates.includes(today)) {
			deps.userProfilesRepository.update({ userId: user.id }, {
				loggedInDates: [...userProfile.loggedInDates, today],
			});
			userProfile.loggedInDates = [...userProfile.loggedInDates, today];
		}

		return await deps.userEntityService.packSelf(userProfile.user, {
			includeSecrets: isSecure,
			userProfile,
		});
	}

	return implement(iContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: iContract['~orpc'].meta.requestName, requireCredential: true, kind: 'read:account' })).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => toPackedUserDetailed(await execute(input, context.principal, context.token, context.ip)));
}
