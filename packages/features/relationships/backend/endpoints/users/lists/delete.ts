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
export function createUsersListsDeleteProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'userListsRepository'>) {
	return implement(relationshipsContract["users/lists/delete"], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'users/lists/delete', requireCredential: true, kind: 'write:account' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const list = await deps.userListsRepository.findOneBy({ id: input.listId, userId: actor.id });
			if (list == null) throw apiError(relationshipsErrors['users/lists/delete'].noSuchList);
			await deps.userListsRepository.delete(list.id);
		});
}
