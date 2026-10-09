/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toPackedUserListMembership } from '../../relationships.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { relationshipsContract } from '../../relationships.contract.js';
import type { RelationshipsDependencies } from '../../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { relationshipsErrors } from '../../relationships.errors.js';
export function createUsersListsGetMembershipsProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'userListsRepository' | 'queryService' | 'userListMembershipsRepository' | 'userListEntityService'>) {
	return createApiProcedure<Actor>()(relationshipsContract["users/lists/get-memberships"])
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

			return (await deps.userListEntityService.packMembershipsMany(memberships)).map(toPackedUserListMembership);
		});
}
