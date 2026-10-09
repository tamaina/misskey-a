/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { type DeleteAccountService } from '../../../services/DeleteAccountService.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { UsersInputs } from '../../../api.definition.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';

import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { adminAccountsDeleteContract } from './delete.contract.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

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

	return createApiProcedure<MiLocalUser>()(adminAccountsDeleteContract).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => await execute(input, context.principal, context.token, context.ip));
}
