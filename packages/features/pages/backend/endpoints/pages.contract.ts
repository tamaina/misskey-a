/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { iPageLikesContract } from './i/page-likes.contract.js';
import { iPagesContract } from './i/pages.contract.js';
import { pagePushContract } from './page-push.contract.js';
import { pagesCreateContract } from './pages/create.contract.js';
import { pagesDeleteContract } from './pages/delete.contract.js';
import { pagesFeaturedContract } from './pages/featured.contract.js';
import { pagesLikeContract } from './pages/like.contract.js';
import { pagesShowContract } from './pages/show.contract.js';
import { pagesUnlikeContract } from './pages/unlike.contract.js';
import { pagesUpdateContract } from './pages/update.contract.js';
import { usersPagesContract } from './users/pages.contract.js';

export const pagesContract = {
	iPageLikes: iPageLikesContract,
	iPages: iPagesContract,
	pagePush: pagePushContract,
	pagesCreate: pagesCreateContract,
	pagesDelete: pagesDeleteContract,
	pagesFeatured: pagesFeaturedContract,
	pagesLike: pagesLikeContract,
	pagesShow: pagesShowContract,
	pagesUnlike: pagesUnlikeContract,
	pagesUpdate: pagesUpdateContract,
	usersPages: usersPagesContract,
};
