/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { iPageLikesContract } from './endpoints/i/page-likes.contract.js';
import type { iPagesContract } from './endpoints/i/pages.contract.js';
import type { pagePushContract } from './endpoints/page-push.contract.js';
import type { pagesCreateContract } from './endpoints/pages/create.contract.js';
import type { pagesDeleteContract } from './endpoints/pages/delete.contract.js';
import type { pagesFeaturedContract } from './endpoints/pages/featured.contract.js';
import type { pagesLikeContract } from './endpoints/pages/like.contract.js';
import type { pagesShowContract } from './endpoints/pages/show.contract.js';
import type { pagesUnlikeContract } from './endpoints/pages/unlike.contract.js';
import type { pagesUpdateContract } from './endpoints/pages/update.contract.js';
import type { usersPagesContract } from './endpoints/users/pages.contract.js';

export interface PagesOperations<Actor extends ApiActor> {
	iPageLikes(input: InferSchemaOutput<NonNullable<(typeof iPageLikesContract)['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<(typeof iPageLikesContract)['~orpc']['outputSchema']>>>;
	iPages(input: InferSchemaOutput<NonNullable<(typeof iPagesContract)['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<(typeof iPagesContract)['~orpc']['outputSchema']>>>;
	pagePush(input: InferSchemaOutput<NonNullable<(typeof pagePushContract)['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<(typeof pagePushContract)['~orpc']['outputSchema']>>>;
	pagesCreate(input: InferSchemaOutput<NonNullable<(typeof pagesCreateContract)['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<(typeof pagesCreateContract)['~orpc']['outputSchema']>>>;
	pagesDelete(input: InferSchemaOutput<NonNullable<(typeof pagesDeleteContract)['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<(typeof pagesDeleteContract)['~orpc']['outputSchema']>>>;
	pagesFeatured(input: InferSchemaOutput<NonNullable<(typeof pagesFeaturedContract)['~orpc']['inputSchema']>>, actor: Actor | null): Promise<InferSchemaOutput<NonNullable<(typeof pagesFeaturedContract)['~orpc']['outputSchema']>>>;
	pagesLike(input: InferSchemaOutput<NonNullable<(typeof pagesLikeContract)['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<(typeof pagesLikeContract)['~orpc']['outputSchema']>>>;
	pagesShow(input: InferSchemaOutput<NonNullable<(typeof pagesShowContract)['~orpc']['inputSchema']>>, actor: Actor | null): Promise<InferSchemaOutput<NonNullable<(typeof pagesShowContract)['~orpc']['outputSchema']>>>;
	pagesUnlike(input: InferSchemaOutput<NonNullable<(typeof pagesUnlikeContract)['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<(typeof pagesUnlikeContract)['~orpc']['outputSchema']>>>;
	pagesUpdate(input: InferSchemaOutput<NonNullable<(typeof pagesUpdateContract)['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<(typeof pagesUpdateContract)['~orpc']['outputSchema']>>>;
	usersPages(input: InferSchemaOutput<NonNullable<(typeof usersPagesContract)['~orpc']['inputSchema']>>, actor: Actor | null): Promise<InferSchemaOutput<NonNullable<(typeof usersPagesContract)['~orpc']['outputSchema']>>>;
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
