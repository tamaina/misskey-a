/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toPackedUserList } from '../../relationships.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { relationshipsContract } from '../../relationships.contract.js';
import type { RelationshipsDependencies } from '../../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { relationshipsErrors } from '../../relationships.errors.js';
export function createUsersListsShowProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'userListsRepository' | 'userListFavoritesRepository' | 'userListEntityService'>) {
	return createApiProcedure<Actor>()(relationshipsContract["users/lists/show"])
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const additionalProperties: Partial<{
				likedCount: number;
				isLiked: boolean;
			}> = {};
			// Fetch the list
			const userList = await deps.userListsRepository.findOneBy(!ps.forPublic && me !== null ? {
				id: ps.listId,
				userId: me.id,
			} : {
				id: ps.listId,
				isPublic: true,
			});

			if (userList == null) {
				throw apiError(relationshipsErrors['users/lists/show'].noSuchList);
			}

			if (ps.forPublic && userList.isPublic) {
				additionalProperties.likedCount = await deps.userListFavoritesRepository.countBy({
					userListId: ps.listId,
				});
				if (me !== null) {
					additionalProperties.isLiked = await deps.userListFavoritesRepository.exists({
						where: {
							userId: me.id,
							userListId: ps.listId,
						},
					});
				} else {
					additionalProperties.isLiked = false;
				}
			}
			return {
				...toPackedUserList(await deps.userListEntityService.pack(userList)),
				...additionalProperties,
			};
		});
}
