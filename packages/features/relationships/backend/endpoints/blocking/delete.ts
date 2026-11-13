/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { relationshipsContract } from '../relationships.contract.js';
import type { RelationshipsDependencies } from '../../api.implementation.js';

import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { relationshipsErrors } from '../relationships.errors.js';
import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
export function createBlockingDeleteProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'usersRepository' | 'getterService' | 'blockingsRepository' | 'userBlockingService' | 'userEntityService'>) {
	return createApiProcedure<Actor>()(relationshipsContract["blocking/delete"]).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const blocker = await deps.usersRepository.findOneByOrFail({ id: me.id });

			// Check if the blockee is yourself
			if (me.id === ps.userId) {
				throw apiError(relationshipsErrors['blocking/delete'].blockeeIsYourself);
			}

			// Get blockee
			const blockee = await deps.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(relationshipsErrors['blocking/delete'].noSuchUser);
				throw err;
			});

			// Check not blocking
			const exist = await deps.blockingsRepository.exists({
				where: {
					blockerId: blocker.id,
					blockeeId: blockee.id,
				},
			});

			if (!exist) {
				throw apiError(relationshipsErrors['blocking/delete'].notBlocking);
			}

			// Delete blocking
			await deps.userBlockingService.unblock(blocker, blockee);
			return toPackedUserDetailed(await deps.userEntityService.pack(blockee.id, blocker, {
				schema: 'UserDetailedNotMe',
			}));
		});
}
