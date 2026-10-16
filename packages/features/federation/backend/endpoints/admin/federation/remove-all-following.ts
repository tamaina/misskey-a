/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import { adminFederationRemoveAllFollowingContract } from './remove-all-following.contract.js';
import type { FollowingsRepository, UsersRepository } from '../../../../../persistence/backend/repositories/models.js';
import type { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
export interface AdminFederationRemoveAllFollowingDependencies {
	usersRepository: Pick<UsersRepository, 'findOneByOrFail'>;
	followingsRepository: Pick<FollowingsRepository, 'findBy'>;
	queueService: Pick<QueueService, 'createUnfollowJob'>;
}
export function createAdminFederationRemoveAllFollowingProcedure<Actor extends ApiActor>(deps: AdminFederationRemoveAllFollowingDependencies) {
	return createApiProcedure<Actor>()(adminFederationRemoveAllFollowingContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			const result = await (async () => {
				const followings = await deps.followingsRepository.findBy({
					followerHost: ps.host,
				});
				const pairs = await Promise.all(followings.map(f => Promise.all([
					deps.usersRepository.findOneByOrFail({ id: f.followerId }),
					deps.usersRepository.findOneByOrFail({ id: f.followeeId }),
				]).then(([from, to]) => [{ id: from.id }, { id: to.id }])));
				deps.queueService.createUnfollowJob(pairs.map(p => ({ from: p[0], to: p[1], silent: true })));
			})();
			return result;
		});
}
