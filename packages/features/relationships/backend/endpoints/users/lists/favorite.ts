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
import { relationshipsErrors } from '../../relationships.errors.js';
export function createUsersListsFavoriteProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'userListsRepository' | 'userListFavoritesRepository' | 'idService'>) {
	return createApiProcedure<Actor>()(relationshipsContract["users/lists/favorite"]).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const errors = relationshipsErrors['users/lists/favorite'];
			if (!await deps.userListsRepository.exists({ where: { id: input.listId, isPublic: true } })) throw apiError(errors.noSuchList);
			if (await deps.userListFavoritesRepository.exists({ where: { userId: actor.id, userListId: input.listId } })) throw apiError(errors.alreadyFavorited);
			await deps.userListFavoritesRepository.insert({ id: deps.idService.gen(), userId: actor.id, userListId: input.listId });
		});
}
