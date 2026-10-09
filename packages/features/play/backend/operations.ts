/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { flashCreateContract } from './endpoints/flash/create.contract.js';
import type { flashDeleteContract } from './endpoints/flash/delete.contract.js';
import type { flashFeaturedContract } from './endpoints/flash/featured.contract.js';
import type { flashLikeContract } from './endpoints/flash/like.contract.js';
import type { flashMyContract } from './endpoints/flash/my.contract.js';
import type { flashMyLikesContract } from './endpoints/flash/my-likes.contract.js';
import type { flashShowContract } from './endpoints/flash/show.contract.js';
import type { flashUnlikeContract } from './endpoints/flash/unlike.contract.js';
import type { flashUpdateContract } from './endpoints/flash/update.contract.js';
import type { flashSearchContract } from './endpoints/flash/search.contract.js';
import type { usersFlashsContract } from './endpoints/users/flashs.contract.js';

export interface PlayOperations<Actor extends ApiActor> {
	flashCreate(input: InferSchemaOutput<NonNullable<(typeof flashCreateContract)['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<(typeof flashCreateContract)['~orpc']['outputSchema']>>>;
	flashDelete(input: InferSchemaOutput<NonNullable<(typeof flashDeleteContract)['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<(typeof flashDeleteContract)['~orpc']['outputSchema']>>>;
	flashFeatured(input: InferSchemaOutput<NonNullable<(typeof flashFeaturedContract)['~orpc']['inputSchema']>>, actor: Actor | null): Promise<InferSchemaOutput<NonNullable<(typeof flashFeaturedContract)['~orpc']['outputSchema']>>>;
	flashLike(input: InferSchemaOutput<NonNullable<(typeof flashLikeContract)['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<(typeof flashLikeContract)['~orpc']['outputSchema']>>>;
	flashMy(input: InferSchemaOutput<NonNullable<(typeof flashMyContract)['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<(typeof flashMyContract)['~orpc']['outputSchema']>>>;
	flashMyLikes(input: InferSchemaOutput<NonNullable<(typeof flashMyLikesContract)['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<(typeof flashMyLikesContract)['~orpc']['outputSchema']>>>;
	flashShow(input: InferSchemaOutput<NonNullable<(typeof flashShowContract)['~orpc']['inputSchema']>>, actor: Actor | null): Promise<InferSchemaOutput<NonNullable<(typeof flashShowContract)['~orpc']['outputSchema']>>>;
	flashUnlike(input: InferSchemaOutput<NonNullable<(typeof flashUnlikeContract)['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<(typeof flashUnlikeContract)['~orpc']['outputSchema']>>>;
	flashUpdate(input: InferSchemaOutput<NonNullable<(typeof flashUpdateContract)['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<(typeof flashUpdateContract)['~orpc']['outputSchema']>>>;
	flashSearch(input: InferSchemaOutput<NonNullable<(typeof flashSearchContract)['~orpc']['inputSchema']>>, actor: Actor | null): Promise<InferSchemaOutput<NonNullable<(typeof flashSearchContract)['~orpc']['outputSchema']>>>;
	usersFlashs(input: InferSchemaOutput<NonNullable<(typeof usersFlashsContract)['~orpc']['inputSchema']>>, actor: Actor | null): Promise<InferSchemaOutput<NonNullable<(typeof usersFlashsContract)['~orpc']['outputSchema']>>>;
}
export type PlayContext<Actor extends ApiActor> = ApiContext<Actor> & { operations: { play: PlayOperations<Actor> } };
export type PlayApplications<Actor extends ApiActor> = { [K in keyof PlayOperations<Actor>]: { execute: PlayOperations<Actor>[K] } };
export function createPlayOperations<Actor extends ApiActor>(applications: PlayApplications<Actor>): PlayOperations<Actor> {
	return {
		flashCreate: (input, actor) => applications.flashCreate.execute(input, actor),
		flashDelete: (input, actor) => applications.flashDelete.execute(input, actor),
		flashFeatured: (input, actor) => applications.flashFeatured.execute(input, actor),
		flashLike: (input, actor) => applications.flashLike.execute(input, actor),
		flashMy: (input, actor) => applications.flashMy.execute(input, actor),
		flashMyLikes: (input, actor) => applications.flashMyLikes.execute(input, actor),
		flashShow: (input, actor) => applications.flashShow.execute(input, actor),
		flashUnlike: (input, actor) => applications.flashUnlike.execute(input, actor),
		flashUpdate: (input, actor) => applications.flashUpdate.execute(input, actor),
		flashSearch: (input, actor) => applications.flashSearch.execute(input, actor),
		usersFlashs: (input, actor) => applications.usersFlashs.execute(input, actor),
	};
}
