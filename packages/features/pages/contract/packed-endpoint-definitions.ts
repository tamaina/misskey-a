/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const packedIPageLikesInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedIPageLikesOutput = v.array(v.strictObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
		"page": packedReference("Page"),
	}));
export const packedIPageLikesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/page-likes", tags: ["account", "pages"] },
	packedIPageLikesInput,
	packedIPageLikesOutput,
);

export const packedIPagesInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedIPagesOutput = v.array(packedReference("Page"));
export const packedIPagesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/pages", tags: ["account", "pages"] },
	packedIPagesInput,
	packedIPagesOutput,
);

export const packedPagesFeaturedInput = v.object({});
export const packedPagesFeaturedOutput = v.array(packedReference("Page"));
export const packedPagesFeaturedDefinition = defineEndpointContract(
	{ method: 'POST', path: "/pages/featured", tags: ["pages"] },
	packedPagesFeaturedInput,
	packedPagesFeaturedOutput,
);

export const packedUsersPagesInput = v.object({
	"userId": misskeyId,
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedUsersPagesOutput = v.array(packedReference("Page"));
export const packedUsersPagesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/users/pages", tags: ["users", "pages"] },
	packedUsersPagesInput,
	packedUsersPagesOutput,
);

export const packedEndpointDefinitions = {
	"i/page-likes": packedIPageLikesDefinition,
	"i/pages": packedIPagesDefinition,
	"pages/featured": packedPagesFeaturedDefinition,
	"users/pages": packedUsersPagesDefinition,
} as const;

export const packedEndpointContracts = {
	"i/page-likes": packedIPageLikesDefinition.contract,
	"i/pages": packedIPagesDefinition.contract,
	"pages/featured": packedPagesFeaturedDefinition.contract,
	"users/pages": packedUsersPagesDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
