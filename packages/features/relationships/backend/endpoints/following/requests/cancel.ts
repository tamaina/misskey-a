/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toPackedUserLite } from '@features/users/backend/user.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { relationshipsContract } from '../../relationships.contract.js';
import type { RelationshipsDependencies } from '../../../api.implementation.js';
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { relationshipsErrors } from '../../relationships.errors.js';
export function createFollowingRequestsCancelProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'getterService' | 'userFollowingService' | 'userEntityService'>) {
	return createApiProcedure<Actor>()(relationshipsContract["following/requests/cancel"]).use(requirePrincipal<Actor>())
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

			return toPackedUserLite(await deps.userEntityService.pack(followee.id, me));
		});
}
