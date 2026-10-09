/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { authentication, apiPolicy } from '@features/api/backend/transport/middleware.js';
import { relationshipsContract } from '../../relationships.contract.js';
import type { RelationshipsDependencies } from '../../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { relationshipsErrors } from '../../relationships.errors.js';
export function createUsersListsGetMembershipsProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'userListsRepository' | 'queryService' | 'userListMembershipsRepository' | 'userListEntityService'>) {
	return implement(relationshipsContract["users/lists/get-memberships"], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'users/lists/get-memberships', requireCredential: false, kind: 'read:account' }))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			// Fetch the list
			const userList = await deps.userListsRepository.findOneBy(!ps.forPublic && me !== null ? {
				id: ps.listId,
				userId: me.id,
			} : {
				id: ps.listId,
				isPublic: true,
			});

			if (userList == null) {
				throw apiError(relationshipsErrors['users/lists/get-memberships'].noSuchList);
			}

			const query = deps.queryService.makePaginationQuery(deps.userListMembershipsRepository.createQueryBuilder('membership'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('membership.userListId = :userListId', { userListId: userList.id })
				.innerJoinAndSelect('membership.user', 'user');

			const memberships = await query
				.limit(ps.limit)
				.getMany();

			return deps.userListEntityService.packMembershipsMany(memberships);
		});
}
