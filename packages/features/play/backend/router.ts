/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import type { ApiContext } from '../../api/backend/transport/context.js';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import type { PlayDependencies } from './api.dependencies.js';
import { playContract } from './endpoints/play.contract.js';
import { createFlashCreateProcedure } from './endpoints/flash/create.js';
import { createFlashDeleteProcedure } from './endpoints/flash/delete.js';
import { createFlashFeaturedProcedure } from './endpoints/flash/featured.js';
import { createFlashLikeProcedure } from './endpoints/flash/like.js';
import { createFlashMyProcedure } from './endpoints/flash/my.js';
import { createFlashMyLikesProcedure } from './endpoints/flash/my-likes.js';
import { createFlashShowProcedure } from './endpoints/flash/show.js';
import { createFlashUnlikeProcedure } from './endpoints/flash/unlike.js';
import { createFlashUpdateProcedure } from './endpoints/flash/update.js';
import { createFlashSearchProcedure } from './endpoints/flash/search.js';
import { createUsersFlashsProcedure } from './endpoints/users/flashs.js';
export function createPlayRouter(deps: PlayDependencies) {
	return implement(playContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().router({
		flashCreate: createFlashCreateProcedure(deps),
		flashDelete: createFlashDeleteProcedure(deps),
		flashFeatured: createFlashFeaturedProcedure(deps),
		flashLike: createFlashLikeProcedure(deps),
		flashMy: createFlashMyProcedure(deps),
		flashMyLikes: createFlashMyLikesProcedure(deps),
		flashShow: createFlashShowProcedure(deps),
		flashUnlike: createFlashUnlikeProcedure(deps),
		flashUpdate: createFlashUpdateProcedure(deps),
		flashSearch: createFlashSearchProcedure(deps),
		usersFlashs: createUsersFlashsProcedure(deps),
	});
}
