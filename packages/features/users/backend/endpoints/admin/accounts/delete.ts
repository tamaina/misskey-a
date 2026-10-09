/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { type DeleteAccountService } from '../../../services/DeleteAccountService.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { UsersInputs } from '../../../api.contract.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';

import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { adminAccountsDeleteContract } from './delete.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface AdminAccountsDeleteDependencies {
	usersRepository: UsersRepository;
	deleteAccoountService: DeleteAccountService;
}
export function createAdminAccountsDeleteProcedure(deps: AdminAccountsDeleteDependencies) {
	async function execute(ps: UsersInputs['admin/accounts/delete'], me: MiLocalUser, _token: ApiToken | null, _ip: string) {
		const user = await deps.usersRepository.findOneBy({ id: ps.userId });

		if (user == null) {
			throw new Error('user not found');
		}

		await deps.deleteAccoountService.deleteAccount(user, me);
	}

	return implement(adminAccountsDeleteContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: adminAccountsDeleteContract['~orpc'].meta.requestName, requireCredential: true, requireAdmin: true, kind: 'write:admin:account' })).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => await execute(input, context.principal, context.token, context.ip));
}
