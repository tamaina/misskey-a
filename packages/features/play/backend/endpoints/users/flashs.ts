/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import { usersFlashsContract } from './flashs.contract.js';
import type { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { FlashEntityService } from '../../serializers/FlashEntityService.js';
import type { FlashsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface UsersFlashsDependencies {
	flashsRepository: Pick<FlashsRepository, 'createQueryBuilder'>;
	flashEntityService: Pick<FlashEntityService, 'packMany'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
}
export function createUsersFlashsProcedure(deps: UsersFlashsDependencies) {
	return implement(usersFlashsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: usersFlashsContract['~orpc'].meta.requestName }))
		.handler(async ({ input: ps }) => {
			const query = deps.queryService.makePaginationQuery(deps.flashsRepository.createQueryBuilder('flash'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('flash.userId = :userId', { userId: ps.userId })
				.andWhere('flash.visibility = \'public\'');
			const flashs = await query
				.limit(ps.limit)
				.getMany();
			return await deps.flashEntityService.packMany(flashs);
		});
}
