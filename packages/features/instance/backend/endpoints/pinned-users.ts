/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { IsNull } from 'typeorm';
import * as Acct from '@features/federation/backend/utility/acct.js';
import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '@features/api/backend/transport/middleware.js';
import { pinnedUsersContract } from './pinned-users.contract.js';
import type { InstanceApiDependencies } from '../api.implementation.js';
export type PinnedUsersDependencies = Pick<InstanceApiDependencies, 'serverSettings' | 'usersRepository' | 'userEntityService'>;
export function createPinnedUsersProcedure<Actor extends ApiActor>(deps: PinnedUsersDependencies) {
	return implement(pinnedUsersContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'pinned-users' }))
		.handler(async ({ input, context }) => {
			const me = context.principal;
			const users = await Promise.all(deps.serverSettings.pinnedUsers.map(acct => Acct.parse(acct)).map(acct => deps.usersRepository.findOneBy({
				usernameLower: acct.username.toLowerCase(),
				host: acct.host ?? IsNull(),
			})));
			return (await deps.userEntityService.packMany(users.filter(x => x != null), me, { schema: 'UserDetailed' })).map(toPackedUserDetailed);
		});
}
