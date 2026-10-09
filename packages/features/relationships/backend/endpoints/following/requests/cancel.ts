/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiContext } from '../../../../../api/backend/transport/context.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { relationshipsContract } from '../../relationships.contract.js';
import type { RelationshipsDependencies } from '../../../api.dependencies.js';
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { relationshipsErrors } from '../../relationships.errors.js';
export function createFollowingRequestsCancelProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'getterService' | 'userFollowingService' | 'userEntityService'>) {
	return implement(relationshipsContract["following/requests/cancel"], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'following/requests/cancel', requireCredential: true, kind: 'write:following' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			// Fetch followee
			const followee = await deps.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(relationshipsErrors['following/requests/cancel'].noSuchUser);
				throw err;
			});

			try {
				await deps.userFollowingService.cancelFollowRequest(followee, me);
			} catch (err) {
				if (err instanceof IdentifiableError) {
					if (err.id === '17447091-ce07-46dd-b331-c1fd4f15b1e7') throw apiError(relationshipsErrors['following/requests/cancel'].followRequestNotFound);
				}
				throw err;
			}

			return await deps.userEntityService.pack(followee.id, me);
		});
}
