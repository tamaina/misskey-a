/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { misskeyId } from '../../api/contract/index.js';

export const selectorIRevokeTokenInput = v.union([
	jsonObject({
		tokenId: misskeyId,
	}),
	jsonObject({
		token: v.nullable(v.string()),
	}),
]);
export const selectorIRevokeTokenOutput = v.void();
export const selectorIRevokeTokenDefinition = defineEndpointContract(
	{ method: 'POST', path: '/i/revoke-token' },
	selectorIRevokeTokenInput,
	selectorIRevokeTokenOutput,
);

export const selectorEndpointDefinitions = {
	'i/revoke-token': selectorIRevokeTokenDefinition,
} as const;

export const selectorEndpointContracts = {
	'i/revoke-token': selectorIRevokeTokenDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof selectorEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof selectorEndpointContracts>;
export type SelectorEndpoints = {
	[K in keyof typeof selectorEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
