/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toPackedFlash } from '../../flash.schema.js';

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { flashSearchContract } from './search.contract.js';
import type { FlashEntityService } from '../../serializers/FlashEntityService.js';
import type { FlashService } from '../../services/FlashService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface FlashSearchDependencies {
	flashService: Pick<FlashService, 'search'>;
	flashEntityService: Pick<FlashEntityService, 'packMany'>;
}
export function createFlashSearchProcedure(deps: FlashSearchDependencies) {
	return createApiProcedure<MiLocalUser>()(flashSearchContract)
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const result = await deps.flashService.search(ps.query, {
				sinceId: ps.sinceId,
				untilId: ps.untilId,
				sinceDate: ps.sinceDate,
				untilDate: ps.untilDate,
				limit: ps.limit,
			});
			return (await deps.flashEntityService.packMany(result, me)).map(toPackedFlash);
		});
}
