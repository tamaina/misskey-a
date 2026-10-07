/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId, objectParams } from '../../api/contract/index.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';
import { pageNameSchema } from './page-name.js';

// Match the Unicode pattern mode used by the existing JSON Schema/AJV validator.

export const portablePagesCreateInput = jsonObject({
	"title": v.string(),
	"name": jsonString({ minLength: 1, pattern: pageNameSchema.pattern }),
	"summary": v.exactOptional(v.nullable(v.string())),
	"content": v.array(v.pipe(v.pipe(objectParams, v.metadata({ properties: undefined })), v.metadata({ "required": undefined }))),
	"variables": v.array(v.pipe(v.pipe(objectParams, v.metadata({ properties: undefined })), v.metadata({ "required": undefined }))),
	"script": v.string(),
	"eyeCatchingImageId": v.exactOptional(v.nullable(misskeyId)),
	"font": v.optional(v.picklist(["serif", "sans-serif"]), "sans-serif"),
	"alignCenter": v.optional(v.boolean(), false),
	"hideTitleWhenPinned": v.optional(v.boolean(), false),
});
export const portablePagesCreateOutput = packedReference("Page");
export const portablePagesCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/pages/create", tags: ["pages"] },
	portablePagesCreateInput,
	portablePagesCreateOutput,
);

export const portablePagesUpdateInput = jsonObject({
	"pageId": misskeyId,
	"title": v.exactOptional(v.string()),
	"name": v.exactOptional(jsonString({ minLength: 1, pattern: pageNameSchema.pattern })),
	"summary": v.exactOptional(v.nullable(v.string())),
	"content": v.exactOptional(v.array(v.pipe(v.pipe(objectParams, v.metadata({ properties: undefined })), v.metadata({ "required": undefined })))),
	"variables": v.exactOptional(v.array(v.pipe(v.pipe(objectParams, v.metadata({ properties: undefined })), v.metadata({ "required": undefined })))),
	"script": v.exactOptional(v.string()),
	"eyeCatchingImageId": v.exactOptional(v.nullable(misskeyId)),
	"font": v.exactOptional(v.picklist(["serif", "sans-serif"])),
	"alignCenter": v.exactOptional(v.boolean()),
	"hideTitleWhenPinned": v.exactOptional(v.boolean()),
});
export const portablePagesUpdateOutput = v.void();
export const portablePagesUpdateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/pages/update", tags: ["pages"] },
	portablePagesUpdateInput,
	portablePagesUpdateOutput,
);

export const portableConstantEndpointDefinitions = {
	"pages/create": portablePagesCreateDefinition,
	"pages/update": portablePagesUpdateDefinition,
} as const;

export const portableConstantEndpointContracts = {
	"pages/create": portablePagesCreateDefinition.contract,
	"pages/update": portablePagesUpdateDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof portableConstantEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof portableConstantEndpointContracts>;
export type PortableConstantEndpoints = {
	[K in keyof typeof portableConstantEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
