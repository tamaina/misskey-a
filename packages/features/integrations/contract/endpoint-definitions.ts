/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { resultObject } from '../../api/contract/result-object.js';

export const inlineFetchRssInput = v.looseObject({
	"url": v.string(),
});
export const inlineFetchRssOutput = resultObject({
	"image": v.exactOptional(resultObject({
		"link": v.exactOptional(v.string()),
		"url": v.string(),
		"title": v.exactOptional(v.string()),
	})),
	"paginationLinks": v.exactOptional(resultObject({
		"self": v.exactOptional(v.string()),
		"first": v.exactOptional(v.string()),
		"next": v.exactOptional(v.string()),
		"last": v.exactOptional(v.string()),
		"prev": v.exactOptional(v.string()),
	})),
	"link": v.exactOptional(v.string()),
	"title": v.exactOptional(v.string()),
	"items": v.array(resultObject({
			"link": v.exactOptional(v.string()),
			"guid": v.exactOptional(v.string()),
			"title": v.exactOptional(v.string()),
			"pubDate": v.exactOptional(v.string()),
			"creator": v.exactOptional(v.string()),
			"summary": v.exactOptional(v.string()),
			"content": v.exactOptional(v.string()),
			"isoDate": v.exactOptional(v.string()),
			"categories": v.exactOptional(v.array(v.string())),
			"contentSnippet": v.exactOptional(v.string()),
			"enclosure": v.exactOptional(resultObject({
				"url": v.string(),
				"length": v.exactOptional(v.number()),
				"type": v.exactOptional(v.string()),
			})),
		})),
	"feedUrl": v.exactOptional(v.string()),
	"description": v.exactOptional(v.string()),
	"itunes": v.exactOptional(v.pipe(resultObject({
		"image": v.exactOptional(v.string()),
		"owner": v.exactOptional(resultObject({
			"name": v.exactOptional(v.string()),
			"email": v.exactOptional(v.string()),
		})),
		"author": v.exactOptional(v.string()),
		"summary": v.exactOptional(v.string()),
		"explicit": v.exactOptional(v.string()),
		"categories": v.exactOptional(v.array(v.string())),
		"keywords": v.exactOptional(v.array(v.string())),
	}), v.metadata({ "additionalProperties": true }))),
});
export const inlineFetchRssDefinition = defineEndpointContract(
	{ method: 'POST', path: '/fetch-rss', tags: ["meta"] },
	inlineFetchRssInput,
	inlineFetchRssOutput,
);

export const inlineFetchExternalResourcesInput = v.looseObject({
	"url": v.string(),
	"hash": v.string(),
});
export const inlineFetchExternalResourcesOutput = resultObject({
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
