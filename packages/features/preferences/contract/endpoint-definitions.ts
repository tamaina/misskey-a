/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { resultObject } from '../../api/contract/result-object.js';

export const inlineIRegistryScopesWithDomainInput = v.looseObject({});
export const inlineIRegistryScopesWithDomainOutput = v.array(resultObject({
		"scopes": v.array(v.array(v.string())),
		"domain": v.nullable(v.string()),
	}));
export const inlineIRegistryScopesWithDomainDefinition = defineEndpointContract(
	{ method: 'POST', path: '/i/registry/scopes-with-domain' },
	inlineIRegistryScopesWithDomainInput,
	inlineIRegistryScopesWithDomainOutput,
);

export const inlineEndpointDefinitions = {
	"i/registry/scopes-with-domain": inlineIRegistryScopesWithDomainDefinition,
} as const;

export const inlineEndpointContracts = {
	"i/registry/scopes-with-domain": inlineIRegistryScopesWithDomainDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof inlineEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof inlineEndpointContracts>;
export type NativeInlineEndpoints = {
	[K in keyof typeof inlineEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
