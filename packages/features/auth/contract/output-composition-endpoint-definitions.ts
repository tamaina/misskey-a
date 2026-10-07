/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';
import { resultObject } from '../../api/contract/result-object.js';
import { jsonString } from '../../api/contract/index.js';
import { localUsernameSchema, passwordSchema } from '../../users/contract/user-credentials.js';

export const compositionAdminAccountsCreateInput = jsonObject({
	username: jsonString(localUsernameSchema),
	password: jsonString(passwordSchema),
	setupPassword: v.exactOptional(v.nullable(v.string())),
});
export const compositionAdminAccountsCreateOutput = v.pipe(v.intersect([
	packedReference('MeDetailed'),
	resultObject({ token: v.string() }),
]), v.metadata({ type: 'object' }));
export const compositionAdminAccountsCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: '/admin/accounts/create', tags: ["admin"] },
	compositionAdminAccountsCreateInput,
	compositionAdminAccountsCreateOutput,
);

export const outputCompositionEndpointDefinitions = {
	'admin/accounts/create': compositionAdminAccountsCreateDefinition,
} as const;

export const outputCompositionEndpointContracts = {
	'admin/accounts/create': compositionAdminAccountsCreateDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof outputCompositionEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof outputCompositionEndpointContracts>;
export type OutputCompositionEndpoints = {
	[K in keyof typeof outputCompositionEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
