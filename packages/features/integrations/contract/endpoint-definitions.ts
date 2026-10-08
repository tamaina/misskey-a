/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { rssFeedSchema } from './rss-feed.js';

export const inlineFetchRssInput = v.object({
	"url": v.string(),
});
export const inlineFetchRssOutput = rssFeedSchema;
export const inlineFetchRssDefinition = defineEndpointContract(
	{ method: 'POST', path: '/fetch-rss', tags: ["meta"] },
	inlineFetchRssInput,
	inlineFetchRssOutput,
);

export const inlineFetchExternalResourcesInput = v.object({
	"url": v.string(),
	"hash": v.string(),
});
export const inlineFetchExternalResourcesOutput = v.strictObject({
	"type": v.string(),
	"data": v.string(),
});
export const inlineFetchExternalResourcesDefinition = defineEndpointContract(
	{ method: 'POST', path: '/fetch-external-resources', tags: ["meta"] },
	inlineFetchExternalResourcesInput,
	inlineFetchExternalResourcesOutput,
);

export const inlineEndpointDefinitions = {
	"fetch-rss": inlineFetchRssDefinition,
	"fetch-external-resources": inlineFetchExternalResourcesDefinition,
} as const;

export const inlineEndpointContracts = {
	"fetch-rss": inlineFetchRssDefinition.contract,
	"fetch-external-resources": inlineFetchExternalResourcesDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof inlineEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof inlineEndpointContracts>;
export type NativeInlineEndpoints = {
	[K in keyof typeof inlineEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
