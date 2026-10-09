/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiContext } from '../../../../../api/backend/transport/context.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { relationshipsContract } from '../../relationships.contract.js';
import type { RelationshipsDependencies } from '../../../api.dependencies.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { relationshipsErrors } from '../../relationships.errors.js';
export function createUsersListsUnfavoriteProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'userListsRepository' | 'userListFavoritesRepository'>) {
	return implement(relationshipsContract["users/lists/unfavorite"], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'users/lists/unfavorite', requireCredential: true, kind: 'write:account' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const errors = relationshipsErrors['users/lists/unfavorite'];
			if (!await deps.userListsRepository.exists({ where: { id: input.listId, isPublic: true } })) throw apiError(errors.noSuchList);
			const favorite = await deps.userListFavoritesRepository.findOneBy({ userListId: input.listId, userId: actor.id });
			if (favorite === null) throw apiError(errors.notFavorited);
			await deps.userListFavoritesRepository.delete({ id: favorite.id });
		});
}
