/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { PagesContext } from './operations.js';
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

export function createPagesRouter<Actor extends ApiActor>() {
	return implement(pagesContract).$context<PagesContext<Actor>>().router({
		iPageLikes: createIPageLikesProcedure<Actor>(),
		iPages: createIPagesProcedure<Actor>(),
		pagePush: createPagePushProcedure<Actor>(),
		pagesCreate: createPagesCreateProcedure<Actor>(),
		pagesDelete: createPagesDeleteProcedure<Actor>(),
		pagesFeatured: createPagesFeaturedProcedure<Actor>(),
		pagesLike: createPagesLikeProcedure<Actor>(),
		pagesShow: createPagesShowProcedure<Actor>(),
		pagesUnlike: createPagesUnlikeProcedure<Actor>(),
		pagesUpdate: createPagesUpdateProcedure<Actor>(),
		usersPages: createUsersPagesProcedure<Actor>(),
	});
}
