/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { resultObject } from '../../api/contract/result-object.js';

export const remainingUsernameAvailableInput = v.looseObject({
	"username": v.pipe(v.string(), v.regex(new RegExp("^\\w{1,20}$"))),
});
export const remainingUsernameAvailableOutput = resultObject({
	"available": v.boolean(),
});
export const remainingUsernameAvailableDefinition = defineEndpointContract(
	{ method: 'POST', path: "/username/available", tags: ["users"] },
	remainingUsernameAvailableInput,
	remainingUsernameAvailableOutput,
);

export const remainingInlineEndpointDefinitions = {
	"username/available": remainingUsernameAvailableDefinition,
} as const;

export const remainingInlineEndpointContracts = {
	"username/available": remainingUsernameAvailableDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof remainingInlineEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof remainingInlineEndpointContracts>;
export type RemainingInlineEndpoints = {
	[K in keyof typeof remainingInlineEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
