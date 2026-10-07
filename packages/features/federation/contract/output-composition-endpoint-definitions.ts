/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const compositionApShowInput = jsonObject({
	uri: v.string(),
});
export const compositionApShowOutput = v.variant('type', [
	v.strictObject({
		type: v.picklist(['User']),
		object: packedReference('UserDetailedNotMe'),
	}),
	v.strictObject({
		type: v.picklist(['Note']),
		object: packedReference('Note'),
	}),
]);
export const compositionApShowDefinition = defineEndpointContract(
	{ method: 'POST', path: '/ap/show', tags: ["federation"] },
	compositionApShowInput,
	compositionApShowOutput,
);

export const outputCompositionEndpointDefinitions = {
	'ap/show': compositionApShowDefinition,
} as const;

export const outputCompositionEndpointContracts = {
	'ap/show': compositionApShowDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof outputCompositionEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof outputCompositionEndpointContracts>;
export type OutputCompositionEndpoints = {
	[K in keyof typeof outputCompositionEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
