/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { IPageLikesDependencies } from './endpoints/i/page-likes.js';
import type { IPagesDependencies } from './endpoints/i/pages.js';
import type { PagePushDependencies } from './endpoints/page-push.js';
import type { PagesCreateDependencies } from './endpoints/pages/create.js';
import type { PagesDeleteDependencies } from './endpoints/pages/delete.js';
import type { PagesFeaturedDependencies } from './endpoints/pages/featured.js';
import type { PagesLikeDependencies } from './endpoints/pages/like.js';
import type { PagesShowDependencies } from './endpoints/pages/show.js';
import type { PagesUnlikeDependencies } from './endpoints/pages/unlike.js';
import type { PagesUpdateDependencies } from './endpoints/pages/update.js';
import type { UsersPagesDependencies } from './endpoints/users/pages.js';
export type PagesDependencies = IPageLikesDependencies
	& IPagesDependencies
	& PagePushDependencies
	& PagesCreateDependencies
	& PagesDeleteDependencies
	& PagesFeaturedDependencies
	& PagesLikeDependencies
	& PagesShowDependencies
	& PagesUnlikeDependencies
	& PagesUpdateDependencies
	& UsersPagesDependencies;
