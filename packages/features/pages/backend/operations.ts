/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { iPageLikesInput, iPageLikesOutput } from './endpoints/i/page-likes.contract.js';
import type { iPagesInput, iPagesOutput } from './endpoints/i/pages.contract.js';
import type { pagePushInput, pagePushOutput } from './endpoints/page-push.contract.js';
import type { pagesCreateInput, pagesCreateOutput } from './endpoints/pages/create.contract.js';
import type { pagesDeleteInput, pagesDeleteOutput } from './endpoints/pages/delete.contract.js';
import type { pagesFeaturedInput, pagesFeaturedOutput } from './endpoints/pages/featured.contract.js';
import type { pagesLikeInput, pagesLikeOutput } from './endpoints/pages/like.contract.js';
import type { pagesShowInput, pagesShowOutput } from './endpoints/pages/show.contract.js';
import type { pagesUnlikeInput, pagesUnlikeOutput } from './endpoints/pages/unlike.contract.js';
import type { pagesUpdateInput, pagesUpdateOutput } from './endpoints/pages/update.contract.js';
import type { usersPagesInput, usersPagesOutput } from './endpoints/users/pages.contract.js';

export interface PagesOperations<Actor extends ApiActor> {
	iPageLikes(input: v.InferOutput<typeof iPageLikesInput>, actor: Actor): Promise<v.InferOutput<typeof iPageLikesOutput>>;
	iPages(input: v.InferOutput<typeof iPagesInput>, actor: Actor): Promise<v.InferOutput<typeof iPagesOutput>>;
	pagePush(input: v.InferOutput<typeof pagePushInput>, actor: Actor): Promise<v.InferOutput<typeof pagePushOutput>>;
	pagesCreate(input: v.InferOutput<typeof pagesCreateInput>, actor: Actor): Promise<v.InferOutput<typeof pagesCreateOutput>>;
	pagesDelete(input: v.InferOutput<typeof pagesDeleteInput>, actor: Actor): Promise<v.InferOutput<typeof pagesDeleteOutput>>;
	pagesFeatured(input: v.InferOutput<typeof pagesFeaturedInput>, actor: Actor | null): Promise<v.InferOutput<typeof pagesFeaturedOutput>>;
	pagesLike(input: v.InferOutput<typeof pagesLikeInput>, actor: Actor): Promise<v.InferOutput<typeof pagesLikeOutput>>;
	pagesShow(input: v.InferOutput<typeof pagesShowInput>, actor: Actor | null): Promise<v.InferOutput<typeof pagesShowOutput>>;
	pagesUnlike(input: v.InferOutput<typeof pagesUnlikeInput>, actor: Actor): Promise<v.InferOutput<typeof pagesUnlikeOutput>>;
	pagesUpdate(input: v.InferOutput<typeof pagesUpdateInput>, actor: Actor): Promise<v.InferOutput<typeof pagesUpdateOutput>>;
	usersPages(input: v.InferOutput<typeof usersPagesInput>, actor: Actor | null): Promise<v.InferOutput<typeof usersPagesOutput>>;
}
export type PagesContext<Actor extends ApiActor> = ApiContext<Actor> & { operations: { pages: PagesOperations<Actor> } };
export type PagesApplications<Actor extends ApiActor> = { [K in keyof PagesOperations<Actor>]: { execute: PagesOperations<Actor>[K] } };
export function createPagesOperations<Actor extends ApiActor>(applications: PagesApplications<Actor>): PagesOperations<Actor> {
	return {
		iPageLikes: (input, actor) => applications.iPageLikes.execute(input, actor),
		iPages: (input, actor) => applications.iPages.execute(input, actor),
		pagePush: (input, actor) => applications.pagePush.execute(input, actor),
		pagesCreate: (input, actor) => applications.pagesCreate.execute(input, actor),
		pagesDelete: (input, actor) => applications.pagesDelete.execute(input, actor),
		pagesFeatured: (input, actor) => applications.pagesFeatured.execute(input, actor),
		pagesLike: (input, actor) => applications.pagesLike.execute(input, actor),
		pagesShow: (input, actor) => applications.pagesShow.execute(input, actor),
		pagesUnlike: (input, actor) => applications.pagesUnlike.execute(input, actor),
		pagesUpdate: (input, actor) => applications.pagesUpdate.execute(input, actor),
		usersPages: (input, actor) => applications.usersPages.execute(input, actor),
	};
}
