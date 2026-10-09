/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import type { ApiContext } from '../../api/backend/transport/context.js';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import type { PagesDependencies } from './api.dependencies.js';
import { pagesContract } from './endpoints/pages.contract.js';
import { createIPageLikesProcedure } from './endpoints/i/page-likes.js';
import { createIPagesProcedure } from './endpoints/i/pages.js';
import { createPagePushProcedure } from './endpoints/page-push.js';
import { createPagesCreateProcedure } from './endpoints/pages/create.js';
import { createPagesDeleteProcedure } from './endpoints/pages/delete.js';
import { createPagesFeaturedProcedure } from './endpoints/pages/featured.js';
import { createPagesLikeProcedure } from './endpoints/pages/like.js';
import { createPagesShowProcedure } from './endpoints/pages/show.js';
import { createPagesUnlikeProcedure } from './endpoints/pages/unlike.js';
import { createPagesUpdateProcedure } from './endpoints/pages/update.js';
import { createUsersPagesProcedure } from './endpoints/users/pages.js';
export function createPagesRouter(deps: PagesDependencies) {
	return implement(pagesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().router({
		iPageLikes: createIPageLikesProcedure(deps),
		iPages: createIPagesProcedure(deps),
		pagePush: createPagePushProcedure(deps),
		pagesCreate: createPagesCreateProcedure(deps),
		pagesDelete: createPagesDeleteProcedure(deps),
		pagesFeatured: createPagesFeaturedProcedure(deps),
		pagesLike: createPagesLikeProcedure(deps),
		pagesShow: createPagesShowProcedure(deps),
		pagesUnlike: createPagesUnlikeProcedure(deps),
		pagesUpdate: createPagesUpdateProcedure(deps),
		usersPages: createUsersPagesProcedure(deps),
	});
}
