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
export function createFollowingUpdateProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'getterService' | 'followingsRepository' | 'userEntityService'>) {
	return createApiProcedure<Actor>()(relationshipsContract["following/update"]).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const follower = me;

			// Check if the follower is yourself
			if (me.id === ps.userId) {
				throw apiError(relationshipsErrors['following/update'].followeeIsYourself);
			}

			// Get followee
			const followee = await deps.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(relationshipsErrors['following/update'].noSuchUser);
				throw err;
			});

			// Check not following
			const exist = await deps.followingsRepository.findOneBy({
				followerId: follower.id,
				followeeId: followee.id,
			});

			if (exist == null) {
				throw apiError(relationshipsErrors['following/update'].notFollowing);
			}

			await deps.followingsRepository.update({
				id: exist.id,
			}, {
				notify: ps.notify != null ? (ps.notify === 'none' ? null : ps.notify) : undefined,
				withReplies: ps.withReplies != null ? ps.withReplies : undefined,
			});

			return toPackedUserLite(await deps.userEntityService.pack(follower.id, me));
		});
}
