/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import { flashFeaturedContract } from './featured.contract.js';
import type { FlashEntityService } from '../../serializers/FlashEntityService.js';
import type { FlashService } from '../../services/FlashService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface FlashFeaturedDependencies {
	flashService: Pick<FlashService, 'featured'>;
	flashEntityService: Pick<FlashEntityService, 'packMany'>;
}
export function createFlashFeaturedProcedure(deps: FlashFeaturedDependencies) {
	return implement(flashFeaturedContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: flashFeaturedContract['~orpc'].meta.requestName }))
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const result = await deps.flashService.featured({
				offset: ps.offset,
				limit: ps.limit,
			});
			return await deps.flashEntityService.packMany(result, me);
		});
}
