/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';

export const voidResetDbInput = v.looseObject({});
export const voidResetDbOutput = v.void();
export const voidResetDbDefinition = defineEndpointContract(
	{ method: 'POST', path: "/reset-db", tags: ["non-productive"] },
	voidResetDbInput,
	voidResetDbOutput,
);

export const voidEndpointDefinitions = {
	"reset-db": voidResetDbDefinition,
} as const;

export const voidEndpointContracts = {
	"reset-db": voidResetDbDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof voidEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof voidEndpointContracts>;
export type NativeVoidEndpoints = {
	[K in keyof typeof voidEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
