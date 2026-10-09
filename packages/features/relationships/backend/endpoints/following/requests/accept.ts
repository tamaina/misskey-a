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
import { getRelationshipUser, hasErrorId } from '../../relationship-errors.js';
export function createFollowingRequestsAcceptProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'getterService' | 'userFollowingService'>) {
	return implement(relationshipsContract["following/requests/accept"], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'following/requests/accept', requireCredential: true, kind: 'write:following' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const errors = relationshipsErrors['following/requests/accept'];
			const follower = await getRelationshipUser(deps.getterService, input.userId, errors.noSuchUser);
			try {
				await deps.userFollowingService.acceptFollowRequest(actor, follower);
			} catch (error) {
				if (hasErrorId(error, '8884c2dd-5795-4ac9-b27e-6a01d38190f9')) throw apiError(errors.noFollowRequest);
				throw error;
			}
		});
}
