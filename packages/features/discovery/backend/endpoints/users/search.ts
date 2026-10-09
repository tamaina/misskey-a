/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { UserSearchService } from '../../services/UserSearchService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import { discoveryContract, type DiscoveryInputs } from '../discovery.contract.js';
import { toPackedUser } from '@features/users/backend/user.schema.js';
export interface UsersSearchDependencies {
	userEntityService: UserEntityService;
	userSearchService: UserSearchService;
}
export function createUsersSearchProcedure<Actor extends MiLocalUser>(deps: UsersSearchDependencies) {
	const handler = async ({ input: ps, context: { principal: me } }: { input: DiscoveryInputs['users/search']; context: ApiContext<Actor> & { principal: Actor | null } }) => {
		const users = await deps.userSearchService.search(ps.query.trim(), me?.id ?? null, {
			offset: ps.offset,
			limit: ps.limit,
			origin: ps.origin,
		});
		return (await deps.userEntityService.packMany(users, me, { schema: ps.detail ? 'UserDetailed' : 'UserLite' })).map(user => toPackedUser(user));
	};
	return implement(discoveryContract['users/search'], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: discoveryContract['users/search']['~orpc'].meta.requestName, requiredRolePolicy: 'canSearchUsers' })).handler(handler);
}
