/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { flashCreateInput, flashCreateOutput } from './endpoints/flash/create.contract.js';
import type { flashDeleteInput, flashDeleteOutput } from './endpoints/flash/delete.contract.js';
import type { flashFeaturedInput, flashFeaturedOutput } from './endpoints/flash/featured.contract.js';
import type { flashLikeInput, flashLikeOutput } from './endpoints/flash/like.contract.js';
import type { flashMyInput, flashMyOutput } from './endpoints/flash/my.contract.js';
import type { flashMyLikesInput, flashMyLikesOutput } from './endpoints/flash/my-likes.contract.js';
import type { flashShowInput, flashShowOutput } from './endpoints/flash/show.contract.js';
import type { flashUnlikeInput, flashUnlikeOutput } from './endpoints/flash/unlike.contract.js';
import type { flashUpdateInput, flashUpdateOutput } from './endpoints/flash/update.contract.js';
import type { flashSearchInput, flashSearchOutput } from './endpoints/flash/search.contract.js';
import type { usersFlashsInput, usersFlashsOutput } from './endpoints/users/flashs.contract.js';

export interface PlayOperations<Actor extends ApiActor> {
	flashCreate(input: v.InferOutput<typeof flashCreateInput>, actor: Actor): Promise<v.InferOutput<typeof flashCreateOutput>>;
	flashDelete(input: v.InferOutput<typeof flashDeleteInput>, actor: Actor): Promise<v.InferOutput<typeof flashDeleteOutput>>;
	flashFeatured(input: v.InferOutput<typeof flashFeaturedInput>, actor: Actor | null): Promise<v.InferOutput<typeof flashFeaturedOutput>>;
	flashLike(input: v.InferOutput<typeof flashLikeInput>, actor: Actor): Promise<v.InferOutput<typeof flashLikeOutput>>;
	flashMy(input: v.InferOutput<typeof flashMyInput>, actor: Actor): Promise<v.InferOutput<typeof flashMyOutput>>;
	flashMyLikes(input: v.InferOutput<typeof flashMyLikesInput>, actor: Actor): Promise<v.InferOutput<typeof flashMyLikesOutput>>;
	flashShow(input: v.InferOutput<typeof flashShowInput>, actor: Actor | null): Promise<v.InferOutput<typeof flashShowOutput>>;
	flashUnlike(input: v.InferOutput<typeof flashUnlikeInput>, actor: Actor): Promise<v.InferOutput<typeof flashUnlikeOutput>>;
	flashUpdate(input: v.InferOutput<typeof flashUpdateInput>, actor: Actor): Promise<v.InferOutput<typeof flashUpdateOutput>>;
	flashSearch(input: v.InferOutput<typeof flashSearchInput>, actor: Actor | null): Promise<v.InferOutput<typeof flashSearchOutput>>;
	usersFlashs(input: v.InferOutput<typeof usersFlashsInput>, actor: Actor | null): Promise<v.InferOutput<typeof usersFlashsOutput>>;
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
