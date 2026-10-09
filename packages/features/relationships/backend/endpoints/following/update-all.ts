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
export function createFollowingUpdateAllProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'followingsRepository'>) {
	return implement(relationshipsContract["following/update-all"], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({
		name: 'following/update-all', requireCredential: true, kind: 'write:following', limit: {
			duration: ms('1hour'),
			max: 10,
		}
	})).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			await deps.followingsRepository.update({
				followerId: me.id,
			}, {
				notify: ps.notify != null ? (ps.notify === 'none' ? null : ps.notify) : undefined,
				withReplies: ps.withReplies != null ? ps.withReplies : undefined,
			});

			return;
		});
}
