/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { UserSearchService } from '../../services/UserSearchService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { toPackedUser } from '@features/users/backend/user.schema.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import { discoveryContract, type DiscoveryInputs } from '../discovery.contract.js';
export interface UsersSearchByUsernameAndHostDependencies {
	userSearchService: UserSearchService;
}
export function createUsersSearchByUsernameAndHostProcedure<Actor extends MiLocalUser>(deps: UsersSearchByUsernameAndHostDependencies) {
	const handler = async ({ input: ps, context: { principal: me } }: { input: DiscoveryInputs['users/search-by-username-and-host']; context: ApiContext<Actor> & { principal: Actor | null } }) => {
		const users = await deps.userSearchService.searchByUsernameAndHost({
			username: 'username' in ps ? ps.username : undefined,
			host: 'host' in ps ? ps.host : undefined,
		}, {
			limit: ps.limit,
			detail: ps.detail,
		}, me);
		return users.map(user => toPackedUser(user));
	};
	return implement(discoveryContract['users/search-by-username-and-host'], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: discoveryContract['users/search-by-username-and-host']['~orpc'].meta.requestName })).handler(handler);
}
