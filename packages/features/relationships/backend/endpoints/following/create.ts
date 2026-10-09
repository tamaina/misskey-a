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
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { relationshipsErrors } from '../relationships.errors.js';
export function createFollowingCreateProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'getterService' | 'userFollowingService' | 'userEntityService'>) {
	return implement(relationshipsContract["following/create"], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({
		name: 'following/create', requireCredential: true, prohibitMoved: true, kind: 'write:following', limit: {
			duration: ms('1hour'),
			max: 100,
		}
	})).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const follower = me;

			// 自分自身
			if (me.id === ps.userId) {
				throw apiError(relationshipsErrors['following/create'].followeeIsYourself);
			}

			// Get followee
			const followee = await deps.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(relationshipsErrors['following/create'].noSuchUser);
				throw err;
			});

			try {
				await deps.userFollowingService.follow(follower, followee, { withReplies: ps.withReplies });
			} catch (e) {
				if (e instanceof IdentifiableError) {
					if (e.id === 'ec3f65c0-a9d1-47d9-8791-b2e7b9dcdced') throw apiError(relationshipsErrors['following/create'].alreadyFollowing);
					if (e.id === '710e8fb0-b8c3-4922-be49-d5d93d8e6a6e') throw apiError(relationshipsErrors['following/create'].blocking);
					if (e.id === '3338392a-f764-498d-8855-db939dcf8c48') throw apiError(relationshipsErrors['following/create'].blocked);
				}
				throw e;
			}

			return await deps.userEntityService.pack(followee.id, me);
		});
}
