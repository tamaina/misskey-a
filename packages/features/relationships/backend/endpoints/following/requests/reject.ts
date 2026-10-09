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
import { relationshipsErrors } from '../../relationships.errors.js';
import { getRelationshipUser } from '../../relationship-errors.js';
export function createFollowingRequestsRejectProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'getterService' | 'userFollowingService'>) {
	return implement(relationshipsContract["following/requests/reject"], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'following/requests/reject', requireCredential: true, kind: 'write:following' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const follower = await getRelationshipUser(deps.getterService, input.userId, relationshipsErrors['following/requests/reject'].noSuchUser);
			await deps.userFollowingService.rejectFollowRequest(actor, follower);
		});
}
