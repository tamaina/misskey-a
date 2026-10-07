/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';

export const voidSwUnregisterInput = v.object({
	"endpoint": v.string(),
	"auth": v.string(),
	"publickey": v.string(),
});
export const voidSwUnregisterOutput = v.void();
export const voidSwUnregisterDefinition = defineEndpointContract(
	{ method: 'POST', path: "/sw/unregister", tags: ["account"] },
	voidSwUnregisterInput,
	voidSwUnregisterOutput,
);

export const voidEndpointDefinitions = {
	"sw/unregister": voidSwUnregisterDefinition,
} as const;

export const voidEndpointContracts = {
	"sw/unregister": voidSwUnregisterDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof voidEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof voidEndpointContracts>;
export type NativeVoidEndpoints = {
	[K in keyof typeof voidEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
