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
import { toPackedUserDetailed } from '../../../../users/backend/user.schema.js';
export function createBlockingCreateProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'usersRepository' | 'getterService' | 'blockingsRepository' | 'userBlockingService' | 'userEntityService'>) {
	return implement(relationshipsContract["blocking/create"], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({
		name: 'blocking/create', requireCredential: true, kind: 'write:blocks', limit: {
			duration: ms('1hour'),
			max: 20,
		}
	})).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const blocker = await deps.usersRepository.findOneByOrFail({ id: me.id });

			// 自分自身
			if (me.id === ps.userId) {
				throw apiError(relationshipsErrors['blocking/create'].blockeeIsYourself);
			}

			// Get blockee
			const blockee = await deps.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(relationshipsErrors['blocking/create'].noSuchUser);
				throw err;
			});

			// Check if already blocking
			const exist = await deps.blockingsRepository.exists({
				where: {
					blockerId: blocker.id,
					blockeeId: blockee.id,
				},
			});

			if (exist) {
				throw apiError(relationshipsErrors['blocking/create'].alreadyBlocking);
			}

			await deps.userBlockingService.block(blocker, blockee);
			return toPackedUserDetailed(await deps.userEntityService.pack(blockee.id, blocker, {
				schema: 'UserDetailedNotMe',
			}));
		});
}
