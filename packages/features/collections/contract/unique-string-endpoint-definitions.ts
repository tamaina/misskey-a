/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { packedReference } from '../../api/contract/packed-reference.js';
import { jsonString, misskeyId, uniqueStringArray } from '../../api/contract/index.js';

export const uniqueGalleryPostsCreateInput = v.object({
	"title": jsonString({ "minLength": 1 }),
	"description": v.exactOptional(v.nullable(v.string())),
	"fileIds": v.pipe(uniqueStringArray(misskeyId), v.minLength(1), v.maxLength(32)),
	"isSensitive": v.optional(v.boolean(), false),
});
export const uniqueGalleryPostsCreateOutput = packedReference("GalleryPost");
export const uniqueGalleryPostsCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/gallery/posts/create", tags: ["gallery"] },
	uniqueGalleryPostsCreateInput,
	uniqueGalleryPostsCreateOutput,
);

export const uniqueGalleryPostsUpdateInput = v.object({
	"postId": misskeyId,
	"title": v.exactOptional(jsonString({ "minLength": 1 })),
	"description": v.exactOptional(v.nullable(v.string())),
	"fileIds": v.exactOptional(v.pipe(uniqueStringArray(misskeyId), v.minLength(1), v.maxLength(32))),
	"isSensitive": v.optional(v.boolean(), false),
});
export const uniqueGalleryPostsUpdateOutput = packedReference("GalleryPost");
export const uniqueGalleryPostsUpdateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/gallery/posts/update", tags: ["gallery"] },
	uniqueGalleryPostsUpdateInput,
	uniqueGalleryPostsUpdateOutput,
);

export const uniqueStringEndpointDefinitions = {
	"gallery/posts/create": uniqueGalleryPostsCreateDefinition,
	"gallery/posts/update": uniqueGalleryPostsUpdateDefinition,
} as const;

export const uniqueStringEndpointContracts = {
	"gallery/posts/create": uniqueGalleryPostsCreateDefinition.contract,
	"gallery/posts/update": uniqueGalleryPostsUpdateDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof uniqueStringEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof uniqueStringEndpointContracts>;
export type UniqueStringEndpoints = {
	[K in keyof typeof uniqueStringEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
