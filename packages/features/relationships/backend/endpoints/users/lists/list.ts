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
export function createUsersListsListProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'usersRepository' | 'userListsRepository' | 'userListEntityService'>) {
	return createApiProcedure<Actor>()(relationshipsContract["users/lists/list"])
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			if (typeof ps.userId !== 'undefined') {
				const user = await deps.usersRepository.findOneBy({ id: ps.userId });
				if (user === null) throw apiError(relationshipsErrors['users/lists/list'].noSuchUser);
				if (user.host !== null) throw apiError(relationshipsErrors['users/lists/list'].remoteUser);
			} else if (me === null) {
				throw apiError(relationshipsErrors['users/lists/list'].invalidParam);
			}

			const userLists = await deps.userListsRepository.findBy(typeof ps.userId === 'undefined' && me !== null ? {
				userId: me.id,
			} : {
				userId: ps.userId,
				isPublic: true,
			});

			return await Promise.all(userLists.map(async x => toPackedUserList(await deps.userListEntityService.pack(x))));
		});
}
