/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FlashCreateApplicationService } from './applications/flash/create.js';
import { FlashDeleteApplicationService } from './applications/flash/delete.js';
import { FlashFeaturedApplicationService } from './applications/flash/featured.js';
import { FlashLikeApplicationService } from './applications/flash/like.js';
import { FlashMyApplicationService } from './applications/flash/my.js';
import { FlashMyLikesApplicationService } from './applications/flash/my-likes.js';
import { FlashShowApplicationService } from './applications/flash/show.js';
import { FlashUnlikeApplicationService } from './applications/flash/unlike.js';
import { FlashUpdateApplicationService } from './applications/flash/update.js';
import { FlashSearchApplicationService } from './applications/flash/search.js';
import { UsersFlashsApplicationService } from './applications/users/flashs.js';

export const playApplicationProviders = [
	FlashCreateApplicationService,
	FlashDeleteApplicationService,
	FlashFeaturedApplicationService,
	FlashLikeApplicationService,
	FlashMyApplicationService,
	FlashMyLikesApplicationService,
	FlashShowApplicationService,
	FlashUnlikeApplicationService,
	FlashUpdateApplicationService,
	FlashSearchApplicationService,
	UsersFlashsApplicationService,
];
