/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { PlayContext } from './operations.js';
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

export function createPlayRouter<Actor extends ApiActor>() {
	return implement(playContract).$context<PlayContext<Actor>>().router({
		flashCreate: createFlashCreateProcedure<Actor>(),
		flashDelete: createFlashDeleteProcedure<Actor>(),
		flashFeatured: createFlashFeaturedProcedure<Actor>(),
		flashLike: createFlashLikeProcedure<Actor>(),
		flashMy: createFlashMyProcedure<Actor>(),
		flashMyLikes: createFlashMyLikesProcedure<Actor>(),
		flashShow: createFlashShowProcedure<Actor>(),
		flashUnlike: createFlashUnlikeProcedure<Actor>(),
		flashUpdate: createFlashUpdateProcedure<Actor>(),
		flashSearch: createFlashSearchProcedure<Actor>(),
		usersFlashs: createUsersFlashsProcedure<Actor>(),
	});
}
