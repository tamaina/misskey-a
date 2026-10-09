/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import { flashMyLikesContract } from './my-likes.contract.js';
import type { FlashLikeEntityService } from '../../serializers/FlashLikeEntityService.js';
import type { FlashService } from '../../services/FlashService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface FlashMyLikesDependencies {
	flashLikeEntityService: Pick<FlashLikeEntityService, 'packMany'>;
	flashService: Pick<FlashService, 'myLikes'>;
}
export function createFlashMyLikesProcedure(deps: FlashMyLikesDependencies) {
	return implement(flashMyLikesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: flashMyLikesContract['~orpc'].meta.requestName, requireCredential: true, kind: 'read:flash-likes' }))
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
			return deps.flashLikeEntityService.packMany(likes, me);
		});
}
