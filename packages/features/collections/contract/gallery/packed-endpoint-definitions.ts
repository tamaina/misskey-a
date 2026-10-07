/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../../api/contract/definition.js';
import { misskeyId } from '../../../api/contract/index.js';
import { packedReference } from '../../../api/contract/packed-reference.js';

export const packedGalleryFeaturedInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"untilId": v.exactOptional(misskeyId),
});
export const packedGalleryFeaturedOutput = v.array(packedReference("GalleryPost"));
export const packedGalleryFeaturedDefinition = defineEndpointContract(
	{ method: 'POST', path: "/gallery/featured", tags: ["gallery"] },
	packedGalleryFeaturedInput,
	packedGalleryFeaturedOutput,
);

export const packedGalleryPopularInput = v.object({});
export const packedGalleryPopularOutput = v.array(packedReference("GalleryPost"));
export const packedGalleryPopularDefinition = defineEndpointContract(
	{ method: 'POST', path: "/gallery/popular", tags: ["gallery"] },
	packedGalleryPopularInput,
	packedGalleryPopularOutput,
);

export const packedGalleryPostsInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedGalleryPostsOutput = v.array(packedReference("GalleryPost"));
export const packedGalleryPostsDefinition = defineEndpointContract(
	{ method: 'POST', path: "/gallery/posts", tags: ["gallery"] },
	packedGalleryPostsInput,
	packedGalleryPostsOutput,
);

export const packedGalleryPostsShowInput = v.object({
	"postId": misskeyId,
});
export const packedGalleryPostsShowOutput = packedReference("GalleryPost");
export const packedGalleryPostsShowDefinition = defineEndpointContract(
	{ method: 'POST', path: "/gallery/posts/show", tags: ["gallery"] },
	packedGalleryPostsShowInput,
	packedGalleryPostsShowOutput,
);

export const packedIGalleryLikesInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedIGalleryLikesOutput = v.array(v.strictObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
		"post": packedReference("GalleryPost"),
	}));
export const packedIGalleryLikesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/gallery/likes", tags: ["account", "gallery"] },
	packedIGalleryLikesInput,
	packedIGalleryLikesOutput,
);

export const packedIGalleryPostsInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedIGalleryPostsOutput = v.array(packedReference("GalleryPost"));
export const packedIGalleryPostsDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/gallery/posts", tags: ["account", "gallery"] },
	packedIGalleryPostsInput,
	packedIGalleryPostsOutput,
);

export const packedUsersGalleryPostsInput = v.object({
	"userId": misskeyId,
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedUsersGalleryPostsOutput = v.array(packedReference("GalleryPost"));
export const packedUsersGalleryPostsDefinition = defineEndpointContract(
	{ method: 'POST', path: "/users/gallery/posts", tags: ["users", "gallery"] },
	packedUsersGalleryPostsInput,
	packedUsersGalleryPostsOutput,
);

export const packedEndpointDefinitions = {
	"gallery/featured": packedGalleryFeaturedDefinition,
	"gallery/popular": packedGalleryPopularDefinition,
	"gallery/posts": packedGalleryPostsDefinition,
	"gallery/posts/show": packedGalleryPostsShowDefinition,
	"i/gallery/likes": packedIGalleryLikesDefinition,
	"i/gallery/posts": packedIGalleryPostsDefinition,
	"users/gallery/posts": packedUsersGalleryPostsDefinition,
} as const;

export const packedEndpointContracts = {
	"gallery/featured": packedGalleryFeaturedDefinition.contract,
	"gallery/popular": packedGalleryPopularDefinition.contract,
	"gallery/posts": packedGalleryPostsDefinition.contract,
	"gallery/posts/show": packedGalleryPostsShowDefinition.contract,
	"i/gallery/likes": packedIGalleryLikesDefinition.contract,
	"i/gallery/posts": packedIGalleryPostsDefinition.contract,
	"users/gallery/posts": packedUsersGalleryPostsDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
