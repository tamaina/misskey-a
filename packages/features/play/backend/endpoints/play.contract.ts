/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { flashCreateContract } from './flash/create.contract.js';
import { flashDeleteContract } from './flash/delete.contract.js';
import { flashFeaturedContract } from './flash/featured.contract.js';
import { flashLikeContract } from './flash/like.contract.js';
import { flashMyContract } from './flash/my.contract.js';
import { flashMyLikesContract } from './flash/my-likes.contract.js';
import { flashShowContract } from './flash/show.contract.js';
import { flashUnlikeContract } from './flash/unlike.contract.js';
import { flashUpdateContract } from './flash/update.contract.js';
import { flashSearchContract } from './flash/search.contract.js';
import { usersFlashsContract } from './users/flashs.contract.js';

export const playContract = {
	flashCreate: flashCreateContract,
	flashDelete: flashDeleteContract,
	flashFeatured: flashFeaturedContract,
	flashLike: flashLikeContract,
	flashMy: flashMyContract,
	flashMyLikes: flashMyLikesContract,
	flashShow: flashShowContract,
	flashUnlike: flashUnlikeContract,
	flashUpdate: flashUpdateContract,
	flashSearch: flashSearchContract,
	usersFlashs: usersFlashsContract,
};
