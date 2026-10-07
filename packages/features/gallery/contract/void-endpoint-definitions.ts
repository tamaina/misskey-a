/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';

export const voidGalleryPostsDeleteInput = v.looseObject({
	"postId": misskeyId,
});
export const voidGalleryPostsDeleteOutput = v.void();
export const voidGalleryPostsDeleteDefinition = defineEndpointContract(
	{ method: 'POST', path: "/gallery/posts/delete", tags: ["gallery"] },
	voidGalleryPostsDeleteInput,
	voidGalleryPostsDeleteOutput,
);

export const voidGalleryPostsLikeInput = v.looseObject({
	"postId": misskeyId,
});
export const voidGalleryPostsLikeOutput = v.void();
export const voidGalleryPostsLikeDefinition = defineEndpointContract(
	{ method: 'POST', path: "/gallery/posts/like", tags: ["gallery"] },
	voidGalleryPostsLikeInput,
	voidGalleryPostsLikeOutput,
);

export const voidGalleryPostsUnlikeInput = v.looseObject({
	"postId": misskeyId,
});
export const voidGalleryPostsUnlikeOutput = v.void();
export const voidGalleryPostsUnlikeDefinition = defineEndpointContract(
	{ method: 'POST', path: "/gallery/posts/unlike", tags: ["gallery"] },
	voidGalleryPostsUnlikeInput,
	voidGalleryPostsUnlikeOutput,
);

export const voidEndpointDefinitions = {
	"gallery/posts/delete": voidGalleryPostsDeleteDefinition,
	"gallery/posts/like": voidGalleryPostsLikeDefinition,
	"gallery/posts/unlike": voidGalleryPostsUnlikeDefinition,
} as const;

export const voidEndpointContracts = {
	"gallery/posts/delete": voidGalleryPostsDeleteDefinition.contract,
	"gallery/posts/like": voidGalleryPostsLikeDefinition.contract,
	"gallery/posts/unlike": voidGalleryPostsUnlikeDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof voidEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof voidEndpointContracts>;
export type NativeVoidEndpoints = {
	[K in keyof typeof voidEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
