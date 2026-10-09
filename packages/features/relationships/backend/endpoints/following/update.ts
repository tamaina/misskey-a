/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { relationshipsContract } from '../relationships.contract.js';
import type { RelationshipsDependencies } from '../../api.dependencies.js';
import ms from 'ms';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { relationshipsErrors } from '../relationships.errors.js';
export function createFollowingUpdateProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'getterService' | 'followingsRepository' | 'userEntityService'>) {
	return implement(relationshipsContract["following/update"], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({
		name: 'following/update', requireCredential: true, kind: 'write:following', limit: {
			duration: ms('1hour'),
			max: 100,
		}
	})).use(requirePrincipal<Actor>())
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

			return await deps.userEntityService.pack(follower.id, me);
		});
}
