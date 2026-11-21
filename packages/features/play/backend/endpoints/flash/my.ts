/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toPackedFlash } from '../../flash.schema.js';

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { requirePrincipal } from '../../../../api/backend/transport/middleware.js';

import { flashMyContract } from './my.contract.js';
import type { FlashsRepository } from '@features/persistence/backend/repositories/models.js';
import type { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { FlashEntityService } from '../../serializers/FlashEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface FlashMyDependencies {
	flashsRepository: Pick<FlashsRepository, 'createQueryBuilder'>;
	flashEntityService: Pick<FlashEntityService, 'packMany'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
}
export function createFlashMyProcedure(deps: FlashMyDependencies) {
	return createApiProcedure<MiLocalUser>()(flashMyContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.flashsRepository.createQueryBuilder('flash'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('flash.userId = :meId', { meId: me.id });
			const flashs = await query
				.limit(ps.limit)
				.getMany();
			return (await deps.flashEntityService.packMany(flashs)).map(toPackedFlash);
		});
}
