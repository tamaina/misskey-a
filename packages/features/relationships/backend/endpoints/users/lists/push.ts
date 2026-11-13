/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { relationshipsContract } from '../../relationships.contract.js';
import type { RelationshipsDependencies } from '../../../api.implementation.js';

import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { UserListService } from '../../../services/UserListService.js';
import { relationshipsErrors } from '../../relationships.errors.js';
import { getRelationshipUser } from '../../relationship-errors.js';
export function createUsersListsPushProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'userListsRepository' | 'getterService' | 'blockingsRepository' | 'userListMembershipsRepository' | 'userListService'>) {
	return createApiProcedure<Actor>()(relationshipsContract["users/lists/push"]).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const errors = relationshipsErrors['users/lists/push'];
			const list = await deps.userListsRepository.findOneBy({ id: input.listId, userId: actor.id });
			if (list == null) throw apiError(errors.noSuchList);
			const user = await getRelationshipUser(deps.getterService, input.userId, errors.noSuchUser);
			if (user.id !== actor.id && await deps.blockingsRepository.exists({ where: { blockerId: user.id, blockeeId: actor.id } })) throw apiError(errors.youHaveBeenBlocked);
			if (await deps.userListMembershipsRepository.exists({ where: { userListId: list.id, userId: user.id } })) throw apiError(errors.alreadyAdded);
			try {
				await deps.userListService.addMember(user, list, actor);
			} catch (error) {
				if (error instanceof UserListService.TooManyUsersError) throw apiError(errors.tooManyUsers);
				throw error;
			}
		});
}
