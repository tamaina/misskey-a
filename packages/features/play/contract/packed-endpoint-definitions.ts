/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId } from '../../api/contract/index.js';
import { resultObject } from '../../api/contract/result-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const packedFlashCreateInput = v.looseObject({
	"title": v.string(),
	"summary": v.string(),
	"script": v.string(),
	"permissions": v.array(v.string()),
	"visibility": v.optional(v.picklist(["public", "private"]), "public"),
});
export const packedFlashCreateOutput = packedReference("Flash");
export const packedFlashCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/flash/create", tags: ["flash"] },
	packedFlashCreateInput,
	packedFlashCreateOutput,
);

export const packedFlashFeaturedInput = v.looseObject({
	"offset": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(0)), 0),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
});
export const packedFlashFeaturedOutput = v.array(packedReference("Flash"));
export const packedFlashFeaturedDefinition = defineEndpointContract(
	{ method: 'POST', path: "/flash/featured", tags: ["flash"] },
	packedFlashFeaturedInput,
	packedFlashFeaturedOutput,
);

export const packedFlashMyInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedFlashMyOutput = v.array(packedReference("Flash"));
export const packedFlashMyDefinition = defineEndpointContract(
	{ method: 'POST', path: "/flash/my", tags: ["account", "flash"] },
	packedFlashMyInput,
	packedFlashMyOutput,
);

export const packedFlashMyLikesInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"search": v.exactOptional(v.nullable(jsonString({ "minLength": 1, "maxLength": 100 }))),
});
export const packedFlashMyLikesOutput = v.array(resultObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
		"flash": packedReference("Flash"),
	}));
export const packedFlashMyLikesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/flash/my-likes", tags: ["account", "flash"] },
	packedFlashMyLikesInput,
	packedFlashMyLikesOutput,
);

export const packedFlashSearchInput = v.looseObject({
	"query": jsonString({ "minLength": 1, "maxLength": 100 }),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 5),
});
export const packedFlashSearchOutput = v.array(packedReference("Flash"));
export const packedFlashSearchDefinition = defineEndpointContract(
	{ method: 'POST', path: "/flash/search", tags: ["flash"] },
	packedFlashSearchInput,
	packedFlashSearchOutput,
);

export const packedFlashShowInput = v.looseObject({
	"flashId": misskeyId,
});
export const packedFlashShowOutput = packedReference("Flash");
export const packedFlashShowDefinition = defineEndpointContract(
	{ method: 'POST', path: "/flash/show", tags: ["flashs"] },
	packedFlashShowInput,
	packedFlashShowOutput,
);

export const packedUsersFlashsInput = v.looseObject({
	"userId": misskeyId,
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedUsersFlashsOutput = v.array(packedReference("Flash"));
export const packedUsersFlashsDefinition = defineEndpointContract(
	{ method: 'POST', path: "/users/flashs", tags: ["users", "flashs"] },
	packedUsersFlashsInput,
	packedUsersFlashsOutput,
);

export const packedEndpointDefinitions = {
	"flash/create": packedFlashCreateDefinition,
	"flash/featured": packedFlashFeaturedDefinition,
	"flash/my": packedFlashMyDefinition,
	"flash/my-likes": packedFlashMyLikesDefinition,
	"flash/search": packedFlashSearchDefinition,
	"flash/show": packedFlashShowDefinition,
	"users/flashs": packedUsersFlashsDefinition,
} as const;

export const packedEndpointContracts = {
	"flash/create": packedFlashCreateDefinition.contract,
	"flash/featured": packedFlashFeaturedDefinition.contract,
	"flash/my": packedFlashMyDefinition.contract,
	"flash/my-likes": packedFlashMyLikesDefinition.contract,
	"flash/search": packedFlashSearchDefinition.contract,
	"flash/show": packedFlashShowDefinition.contract,
	"users/flashs": packedUsersFlashsDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
