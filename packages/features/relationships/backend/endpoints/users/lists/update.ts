/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toPackedUserList } from '../../relationships.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { relationshipsContract } from '../../relationships.contract.js';
import type { RelationshipsDependencies } from '../../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { relationshipsErrors } from '../../relationships.errors.js';
export function createUsersListsUpdateProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'userListsRepository' | 'userListEntityService'>) {
	return createApiProcedure<Actor>()(relationshipsContract["users/lists/update"]).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const userList = await deps.userListsRepository.findOneBy({
				id: ps.listId,
				userId: me.id,
			});

			if (userList == null) {
				throw apiError(relationshipsErrors['users/lists/update'].noSuchList);
			}

			await deps.userListsRepository.update(userList.id, {
				name: ps.name,
				isPublic: ps.isPublic,
			});

			return toPackedUserList(await deps.userListEntityService.pack(userList.id));
		});
}
