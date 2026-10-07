/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { jsonString } from '../../api/contract/index.js';
import { resultObject } from '../../api/contract/result-object.js';

export const emptyObjectI2faRemoveKeyInput = jsonObject({
	password: v.string(),
	token: v.optional(v.nullable(v.string())),
	credentialId: v.string(),
});
// The legacy HTTP handler returns {}, although its unchanged metadata documents 204.
export const emptyObjectI2faRemoveKeyOutput = resultObject({});
export const emptyObjectI2faRemoveKeyDefinition = defineEndpointContract(
	{ method: 'POST', path: '/i/2fa/remove-key' },
	emptyObjectI2faRemoveKeyInput,
	emptyObjectI2faRemoveKeyOutput,
);

export const emptyObjectI2faUpdateKeyInput = jsonObject({
	name: jsonString({ minLength: 1, maxLength: 30 }),
	credentialId: v.string(),
});
export const emptyObjectI2faUpdateKeyOutput = resultObject({});
export const emptyObjectI2faUpdateKeyDefinition = defineEndpointContract(
	{ method: 'POST', path: '/i/2fa/update-key' },
	emptyObjectI2faUpdateKeyInput,
	emptyObjectI2faUpdateKeyOutput,
);

export const emptyObjectKeyEndpointDefinitions = {
	'i/2fa/remove-key': emptyObjectI2faRemoveKeyDefinition,
	'i/2fa/update-key': emptyObjectI2faUpdateKeyDefinition,
} as const;
export const emptyObjectKeyEndpointContracts = {
	'i/2fa/remove-key': emptyObjectI2faRemoveKeyDefinition.contract,
	'i/2fa/update-key': emptyObjectI2faUpdateKeyDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof emptyObjectKeyEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof emptyObjectKeyEndpointContracts>;
export type EmptyObjectKeyEndpoints = {
	[K in keyof typeof emptyObjectKeyEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
