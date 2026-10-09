/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IPageLikesApplicationService } from './applications/i/page-likes.js';
import { IPagesApplicationService } from './applications/i/pages.js';
import { PagePushApplicationService } from './applications/page-push.js';
import { PagesCreateApplicationService } from './applications/pages/create.js';
import { PagesDeleteApplicationService } from './applications/pages/delete.js';
import { PagesFeaturedApplicationService } from './applications/pages/featured.js';
import { PagesLikeApplicationService } from './applications/pages/like.js';
import { PagesShowApplicationService } from './applications/pages/show.js';
import { PagesUnlikeApplicationService } from './applications/pages/unlike.js';
import { PagesUpdateApplicationService } from './applications/pages/update.js';
import { UsersPagesApplicationService } from './applications/users/pages.js';

export const pagesApplicationProviders = [
	IPageLikesApplicationService,
	IPagesApplicationService,
	PagePushApplicationService,
	PagesCreateApplicationService,
	PagesDeleteApplicationService,
	PagesFeaturedApplicationService,
	PagesLikeApplicationService,
	PagesShowApplicationService,
	PagesUnlikeApplicationService,
	PagesUpdateApplicationService,
	UsersPagesApplicationService,
];
