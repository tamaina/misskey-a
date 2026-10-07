/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { resultObject } from '../../api/contract/result-object.js';

// The one-branch union preserves the legacy anyOf on each retention map value.

export const remainingRetentionInput = v.looseObject({});
export const remainingRetentionOutput = v.array(resultObject({
		"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
		"users": v.number(),
		"data": v.record(v.string(), v.union([v.number()])),
	}));
export const remainingRetentionDefinition = defineEndpointContract(
	{ method: 'POST', path: "/retention", tags: ["users"] },
	remainingRetentionInput,
	remainingRetentionOutput,
);

export const remainingInlineEndpointDefinitions = {
	"retention": remainingRetentionDefinition,
} as const;

export const remainingInlineEndpointContracts = {
	"retention": remainingRetentionDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof remainingInlineEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof remainingInlineEndpointContracts>;
export type RemainingInlineEndpoints = {
	[K in keyof typeof remainingInlineEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
