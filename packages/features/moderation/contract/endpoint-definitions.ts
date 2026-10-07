/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';
import { resultObject } from '../../api/contract/result-object.js';

export const inlineAdminGetUserIpsInput = v.looseObject({
	"userId": misskeyId,
});
export const inlineAdminGetUserIpsOutput = v.array(resultObject({
		"ip": v.string(),
		"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	}));
export const inlineAdminGetUserIpsDefinition = defineEndpointContract(
	{ method: 'POST', path: '/admin/get-user-ips', tags: ["admin"] },
	inlineAdminGetUserIpsInput,
	inlineAdminGetUserIpsOutput,
);

export const inlineEndpointDefinitions = {
	"admin/get-user-ips": inlineAdminGetUserIpsDefinition,
} as const;

export const inlineEndpointContracts = {
	"admin/get-user-ips": inlineAdminGetUserIpsDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof inlineEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof inlineEndpointContracts>;
export type NativeInlineEndpoints = {
	[K in keyof typeof inlineEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
