/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiContext } from '../../../../../api/backend/transport/context.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import { authentication, apiPolicy } from '../../../../../api/backend/transport/middleware.js';
import { relationshipsContract } from '../../relationships.contract.js';
import type { RelationshipsDependencies } from '../../../api.dependencies.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { relationshipsErrors } from '../../relationships.errors.js';
export function createUsersListsListProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'usersRepository' | 'userListsRepository' | 'userListEntityService'>) {
	return implement(relationshipsContract["users/lists/list"], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'users/lists/list', requireCredential: false, kind: 'read:account' }))
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

			return await Promise.all(userLists.map(x => deps.userListEntityService.pack(x)));
		});
}
