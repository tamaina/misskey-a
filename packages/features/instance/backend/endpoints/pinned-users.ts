/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { IsNull } from 'typeorm';
import * as Acct from '@features/federation/backend/utility/acct.js';
import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { pinnedUsersContract } from './pinned-users.contract.js';
import type { InstanceApiDependencies } from '../api.implementation.js';
export type PinnedUsersDependencies = Pick<InstanceApiDependencies, 'serverSettings' | 'usersRepository' | 'userEntityService'>;
export function createPinnedUsersProcedure<Actor extends ApiActor>(deps: PinnedUsersDependencies) {
	return createApiProcedure<Actor>()(pinnedUsersContract)
		.handler(async ({ input, context }) => {
			const me = context.principal;
			const users = await Promise.all(deps.serverSettings.pinnedUsers.map(acct => Acct.parse(acct)).map(acct => deps.usersRepository.findOneBy({
				usernameLower: acct.username.toLowerCase(),
				host: acct.host ?? IsNull(),
			})));
			return (await deps.userEntityService.packMany(users.filter(x => x != null), me, { schema: 'UserDetailed' })).map(toPackedUserDetailed);
		});
}
