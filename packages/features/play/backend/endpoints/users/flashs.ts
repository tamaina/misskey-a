/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toPackedFlash } from '../../flash.schema.js';

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

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
	return createApiProcedure<MiLocalUser>()(usersFlashsContract)
		.handler(async ({ input: ps }) => {
			const query = deps.queryService.makePaginationQuery(deps.flashsRepository.createQueryBuilder('flash'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('flash.userId = :userId', { userId: ps.userId })
				.andWhere('flash.visibility = \'public\'');
			const flashs = await query
				.limit(ps.limit)
				.getMany();
			return (await deps.flashEntityService.packMany(flashs)).map(toPackedFlash);
		});
}
