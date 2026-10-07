/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString } from '../../api/contract/index.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';
import { descriptionSchema } from './user-description.js';

export const portableAdminUpdateProxyAccountInput = v.pipe(jsonObject({
	"description": v.exactOptional(v.nullable(jsonString(descriptionSchema))),
}), v.metadata({ "required": undefined }));
export const portableAdminUpdateProxyAccountOutput = packedReference("UserDetailed");
export const portableAdminUpdateProxyAccountDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/update-proxy-account", tags: ["admin"] },
	portableAdminUpdateProxyAccountInput,
	portableAdminUpdateProxyAccountOutput,
);

export const portableConstantEndpointDefinitions = {
	"admin/update-proxy-account": portableAdminUpdateProxyAccountDefinition,
} as const;

export const portableConstantEndpointContracts = {
	"admin/update-proxy-account": portableAdminUpdateProxyAccountDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof portableConstantEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof portableConstantEndpointContracts>;
export type PortableConstantEndpoints = {
	[K in keyof typeof portableConstantEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
