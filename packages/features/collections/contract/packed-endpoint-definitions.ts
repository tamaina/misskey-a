/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId } from '../../api/contract/index.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const packedClipsCreateInput = v.looseObject({
	"name": jsonString({ "minLength": 1, "maxLength": 100 }),
	"isPublic": v.optional(v.boolean(), false),
	"description": v.exactOptional(v.nullable(jsonString({ "maxLength": 2048 }))),
});
export const packedClipsCreateOutput = packedReference("Clip");
export const packedClipsCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/clips/create", tags: ["clips"] },
	packedClipsCreateInput,
	packedClipsCreateOutput,
);

export const packedClipsListInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedClipsListOutput = v.array(packedReference("Clip"));
export const packedClipsListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/clips/list", tags: ["clips", "account"] },
	packedClipsListInput,
	packedClipsListOutput,
);

export const packedEndpointDefinitions = {
	"clips/create": packedClipsCreateDefinition,
	"clips/list": packedClipsListDefinition,
} as const;

export const packedEndpointContracts = {
	"clips/create": packedClipsCreateDefinition.contract,
	"clips/list": packedClipsListDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
