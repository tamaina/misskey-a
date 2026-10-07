/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { resultObject } from '../../api/contract/result-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';
import { uniqueStringArray } from '../../api/contract/index.js';

export const uniqueAppCreateInput = v.looseObject({
	"name": v.string(),
	"description": v.string(),
	"permission": uniqueStringArray(v.string()),
	"callbackUrl": v.exactOptional(v.nullable(v.string())),
});
export const uniqueAppCreateOutput = packedReference("App");
export const uniqueAppCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/app/create", tags: ["app"] },
	uniqueAppCreateInput,
	uniqueAppCreateOutput,
);

export const uniqueMiauthGenTokenInput = v.looseObject({
	"session": v.nullable(v.string()),
	"name": v.exactOptional(v.nullable(v.string())),
	"description": v.exactOptional(v.nullable(v.string())),
	"iconUrl": v.exactOptional(v.nullable(v.string())),
	"permission": uniqueStringArray(v.string()),
});
export const uniqueMiauthGenTokenOutput = resultObject({
	"token": v.string(),
});
export const uniqueMiauthGenTokenDefinition = defineEndpointContract(
	{ method: 'POST', path: "/miauth/gen-token", tags: ["auth"] },
	uniqueMiauthGenTokenInput,
	uniqueMiauthGenTokenOutput,
);

export const uniqueStringEndpointDefinitions = {
	"app/create": uniqueAppCreateDefinition,
	"miauth/gen-token": uniqueMiauthGenTokenDefinition,
} as const;

export const uniqueStringEndpointContracts = {
	"app/create": uniqueAppCreateDefinition.contract,
	"miauth/gen-token": uniqueMiauthGenTokenDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof uniqueStringEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof uniqueStringEndpointContracts>;
export type UniqueStringEndpoints = {
	[K in keyof typeof uniqueStringEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
