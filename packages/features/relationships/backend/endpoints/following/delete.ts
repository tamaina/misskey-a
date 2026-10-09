/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toPackedUserLite } from '@features/users/backend/user.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { relationshipsContract } from '../relationships.contract.js';
import type { RelationshipsDependencies } from '../../api.implementation.js';

import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { relationshipsErrors } from '../relationships.errors.js';
export function createFollowingDeleteProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'getterService' | 'followingsRepository' | 'userFollowingService' | 'userEntityService'>) {
	return createApiProcedure<Actor>()(relationshipsContract["following/delete"]).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const follower = me;

			// Check if the followee is yourself
			if (me.id === ps.userId) {
				throw apiError(relationshipsErrors['following/delete'].followeeIsYourself);
			}

			// Get followee
			const followee = await deps.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(relationshipsErrors['following/delete'].noSuchUser);
				throw err;
			});

			// Check not following
			const exist = await deps.followingsRepository.exists({
				where: {
					followerId: follower.id,
					followeeId: followee.id,
				},
			});

			if (!exist) {
				throw apiError(relationshipsErrors['following/delete'].notFollowing);
			}

			await deps.userFollowingService.unfollow(follower, followee);

			return toPackedUserLite(await deps.userEntityService.pack(followee.id, me));
		});
}
