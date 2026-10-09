/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { FlashCreateDependencies } from './endpoints/flash/create.js';
import type { FlashDeleteDependencies } from './endpoints/flash/delete.js';
import type { FlashFeaturedDependencies } from './endpoints/flash/featured.js';
import type { FlashLikeDependencies } from './endpoints/flash/like.js';
import type { FlashMyLikesDependencies } from './endpoints/flash/my-likes.js';
import type { FlashMyDependencies } from './endpoints/flash/my.js';
import type { FlashSearchDependencies } from './endpoints/flash/search.js';
import type { FlashShowDependencies } from './endpoints/flash/show.js';
import type { FlashUnlikeDependencies } from './endpoints/flash/unlike.js';
import type { FlashUpdateDependencies } from './endpoints/flash/update.js';
import type { UsersFlashsDependencies } from './endpoints/users/flashs.js';
export type PlayDependencies = FlashCreateDependencies
	& FlashDeleteDependencies
	& FlashFeaturedDependencies
	& FlashLikeDependencies
	& FlashMyLikesDependencies
	& FlashMyDependencies
	& FlashSearchDependencies
	& FlashShowDependencies
	& FlashUnlikeDependencies
	& FlashUpdateDependencies
	& UsersFlashsDependencies;
