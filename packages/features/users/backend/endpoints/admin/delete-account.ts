/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { type DeleteAccountService } from '../../services/DeleteAccountService.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { UsersInputs } from '../../api.definition.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { adminDeleteAccountContract } from './delete-account.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface AdminDeleteAccountDependencies {
	usersRepository: UsersRepository;
	deleteAccountService: DeleteAccountService;
}
export function createAdminDeleteAccountProcedure(deps: AdminDeleteAccountDependencies) {
	async function execute(ps: UsersInputs['admin/delete-account'], me: MiLocalUser, _token: ApiToken | null, _ip: string) {
		const user = await deps.usersRepository.findOneByOrFail({ id: ps.userId });
		if (user.isDeleted) {
			return;
		}

		await deps.deleteAccountService.deleteAccount(user, me);
	}

	return implement(adminDeleteAccountContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: adminDeleteAccountContract['~orpc'].meta.requestName, requireCredential: true, requireAdmin: true, kind: 'write:admin:delete-account' })).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => await execute(input, context.principal, context.token, context.ip));
}
