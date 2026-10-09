/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { type ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { type UserEntityService } from '../../serializers/UserEntityService.js';
import { type SystemAccountService } from '../../services/SystemAccountService.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { UsersInputs } from '../../api.definition.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { adminUpdateProxyAccountContract } from './update-proxy-account.contract.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
export interface AdminUpdateProxyAccountDependencies {
	userEntityService: UserEntityService;
	moderationLogService: ModerationLogService;
	systemAccountService: SystemAccountService;
}
export function createAdminUpdateProxyAccountProcedure(deps: AdminUpdateProxyAccountDependencies) {
	async function execute(ps: UsersInputs['admin/update-proxy-account'], me: MiLocalUser, _token: ApiToken | null, _ip: string) {
		const proxy = await deps.systemAccountService.updateCorrespondingUserProfile('proxy', {
			description: ps.description,
		});

		const updated = await deps.userEntityService.packSelf(proxy.id);

		if (ps.description !== undefined) {
			deps.moderationLogService.log(me, 'updateProxyAccountDescription', {
				before: null, //TODO
				after: ps.description,
			});
		}

		return updated;
	}

	return createApiProcedure<MiLocalUser>()(adminUpdateProxyAccountContract).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => toPackedUserDetailed(await execute(input, context.principal, context.token, context.ip)));
}
