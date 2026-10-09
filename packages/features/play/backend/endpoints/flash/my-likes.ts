/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toPackedFlash } from '../../flash.schema.js';

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { requirePrincipal } from '../../../../api/backend/transport/middleware.js';

import { flashMyLikesContract } from './my-likes.contract.js';
import type { FlashLikeEntityService } from '../../serializers/FlashLikeEntityService.js';
import type { FlashService } from '../../services/FlashService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface FlashMyLikesDependencies {
	flashLikeEntityService: Pick<FlashLikeEntityService, 'packMany'>;
	flashService: Pick<FlashService, 'myLikes'>;
}
export function createFlashMyLikesProcedure(deps: FlashMyLikesDependencies) {
	return createApiProcedure<MiLocalUser>()(flashMyLikesContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const likes = await deps.flashService.myLikes(me.id, {
				sinceId: ps.sinceId,
				untilId: ps.untilId,
				sinceDate: ps.sinceDate,
				untilDate: ps.untilDate,
				limit: ps.limit,
				search: ps.search,
			});
			return (await deps.flashLikeEntityService.packMany(likes, me)).map(like => ({ id: like.id, flash: toPackedFlash(like.flash) }));
		});
}
