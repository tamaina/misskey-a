/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { UserSearchService } from '../../services/UserSearchService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

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
	return createApiProcedure<Actor>()(discoveryContract['users/search']).handler(handler);
}
