/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';

export const inlineHashtagsSearchInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"query": v.string(),
	"offset": v.optional(v.pipe(v.number(), v.integer()), 0),
});
export const inlineHashtagsSearchOutput = v.array(v.string());
export const inlineHashtagsSearchDefinition = defineEndpointContract(
	{ method: 'POST', path: '/hashtags/search', tags: ["hashtags"] },
	inlineHashtagsSearchInput,
	inlineHashtagsSearchOutput,
);

export const inlineHashtagsTrendInput = v.object({});
export const inlineHashtagsTrendOutput = v.array(v.strictObject({
		"tag": v.string(),
		"chart": v.array(v.number()),
		"usersCount": v.number(),
	}));
export const inlineHashtagsTrendDefinition = defineEndpointContract(
	{ method: 'POST', path: '/hashtags/trend', tags: ["hashtags"] },
	inlineHashtagsTrendInput,
	inlineHashtagsTrendOutput,
);

export const inlineEndpointDefinitions = {
	"hashtags/search": inlineHashtagsSearchDefinition,
	"hashtags/trend": inlineHashtagsTrendDefinition,
} as const;

export const inlineEndpointContracts = {
	"hashtags/search": inlineHashtagsSearchDefinition.contract,
	"hashtags/trend": inlineHashtagsTrendDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof inlineEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof inlineEndpointContracts>;
export type NativeInlineEndpoints = {
	[K in keyof typeof inlineEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
