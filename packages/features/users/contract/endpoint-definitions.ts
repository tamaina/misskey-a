/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const inlineIMoveInput = v.object({
	"moveToAccount": v.string(),
});
export const inlineIMoveOutput = packedReference('MeDetailed');
export const inlineIMoveDefinition = defineEndpointContract(
	{ method: 'POST', path: '/i/move', tags: ["users"] },
	inlineIMoveInput,
	inlineIMoveOutput,
);

export const inlineEndpointDefinitions = {
	"i/move": inlineIMoveDefinition,
} as const;

export const inlineEndpointContracts = {
	"i/move": inlineIMoveDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof inlineEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof inlineEndpointContracts>;
export type NativeInlineEndpoints = {
	[K in keyof typeof inlineEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
