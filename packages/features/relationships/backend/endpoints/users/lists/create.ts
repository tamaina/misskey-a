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
export function createUsersListsCreateProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'userListsRepository' | 'roleService' | 'idService' | 'userListEntityService'>) {
	return implement(relationshipsContract["users/lists/create"], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'users/lists/create', requireCredential: true, prohibitMoved: true, kind: 'write:account' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const currentCount = await deps.userListsRepository.countBy({
				userId: me.id,
			});
			if (currentCount >= (await deps.roleService.getUserPolicies(me.id)).userListLimit) {
				throw apiError(relationshipsErrors['users/lists/create'].tooManyUserLists);
			}

			const userList = await deps.userListsRepository.insertOne({
				id: deps.idService.gen(),
				userId: me.id,
				name: ps.name,
			});

			return await deps.userListEntityService.pack(userList);
		});
}
