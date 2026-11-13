/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import bcrypt from 'bcryptjs';
import { type UserAuthService } from '@features/auth/backend/services/UserAuthService.js';
import { type DeleteAccountService } from '../../services/DeleteAccountService.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { UsersInputs } from '../../api.definition.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { UsersRepository, UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { iDeleteAccountContract } from './delete-account.contract.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface IDeleteAccountDependencies {
	usersRepository: UsersRepository;
	userProfilesRepository: UserProfilesRepository;
	userAuthService: UserAuthService;
	deleteAccountService: DeleteAccountService;
}
export function createIDeleteAccountProcedure(deps: IDeleteAccountDependencies) {
	async function execute(ps: UsersInputs['i/delete-account'], me: MiLocalUser, _apiToken: ApiToken | null, _ip: string) {
		const token = ps.token;
		const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: me.id });

		if (profile.twoFactorEnabled) {
			if (token == null) {
				throw new Error('authentication failed');
			}

			try {
				await deps.userAuthService.twoFactorAuthenticate(profile, token);
			} catch (_) {
				throw new Error('authentication failed');
			}
		}

		const userDetailed = await deps.usersRepository.findOneByOrFail({ id: me.id });
		if (userDetailed.isDeleted) {
			return;
		}

		const passwordMatched = await bcrypt.compare(ps.password, profile.password!);
		if (!passwordMatched) {
			throw new Error('incorrect password');
		}

		await deps.deleteAccountService.deleteAccount(me);
	}

	return createApiProcedure<MiLocalUser>()(iDeleteAccountContract).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => await execute(input, context.principal, context.token, context.ip));
}
