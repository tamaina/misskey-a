/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { relationshipsContract } from '../../relationships.contract.js';
import type { RelationshipsDependencies } from '../../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { relationshipsErrors } from '../../relationships.errors.js';
import { getRelationshipUser } from '../../relationship-errors.js';
export function createUsersListsUpdateMembershipProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'userListsRepository' | 'getterService' | 'userListService'>) {
	return implement(relationshipsContract["users/lists/update-membership"], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'users/lists/update-membership', requireCredential: true, prohibitMoved: true, kind: 'write:account' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const errors = relationshipsErrors['users/lists/update-membership'];
			const list = await deps.userListsRepository.findOneBy({ id: input.listId, userId: actor.id });
			if (list == null) throw apiError(errors.noSuchList);
			const user = await getRelationshipUser(deps.getterService, input.userId, errors.noSuchUser);
			await deps.userListService.updateMembership(user, list, { withReplies: input.withReplies });
		});
}
