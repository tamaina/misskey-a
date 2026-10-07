/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { resultObject } from '../../api/contract/result-object.js';

export const inlineSwRegisterInput = v.looseObject({
	"endpoint": v.string(),
	"auth": v.string(),
	"publickey": v.string(),
	"sendReadMessage": v.optional(v.boolean(), false),
});
export const inlineSwRegisterOutput = resultObject({
	"state": v.exactOptional(v.picklist(["already-subscribed", "subscribed"])),
	"key": v.nullable(v.string()),
	"userId": v.string(),
	"endpoint": v.string(),
	"sendReadMessage": v.boolean(),
});
export const inlineSwRegisterDefinition = defineEndpointContract(
	{ method: 'POST', path: '/sw/register', tags: ["account"] },
	inlineSwRegisterInput,
	inlineSwRegisterOutput,
);

export const inlineSwShowRegistrationInput = v.looseObject({
	"endpoint": v.string(),
});
export const inlineSwShowRegistrationOutput = v.nullable(resultObject({
	"userId": v.string(),
	"endpoint": v.string(),
	"sendReadMessage": v.boolean(),
}));
export const inlineSwShowRegistrationDefinition = defineEndpointContract(
	{ method: 'POST', path: '/sw/show-registration', tags: ["account"] },
	inlineSwShowRegistrationInput,
	inlineSwShowRegistrationOutput,
);

export const inlineSwUpdateRegistrationInput = v.looseObject({
	"endpoint": v.string(),
	"sendReadMessage": v.exactOptional(v.boolean()),
});
export const inlineSwUpdateRegistrationOutput = resultObject({
	"userId": v.string(),
	"endpoint": v.string(),
	"sendReadMessage": v.boolean(),
});
export const inlineSwUpdateRegistrationDefinition = defineEndpointContract(
	{ method: 'POST', path: '/sw/update-registration', tags: ["account"] },
	inlineSwUpdateRegistrationInput,
	inlineSwUpdateRegistrationOutput,
);

export const inlineEndpointDefinitions = {
	"sw/register": inlineSwRegisterDefinition,
	"sw/show-registration": inlineSwShowRegistrationDefinition,
	"sw/update-registration": inlineSwUpdateRegistrationDefinition,
} as const;

export const inlineEndpointContracts = {
	"sw/register": inlineSwRegisterDefinition.contract,
	"sw/show-registration": inlineSwShowRegistrationDefinition.contract,
	"sw/update-registration": inlineSwUpdateRegistrationDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof inlineEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof inlineEndpointContracts>;
export type NativeInlineEndpoints = {
	[K in keyof typeof inlineEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
