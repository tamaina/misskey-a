/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { resultObject } from '../../api/contract/result-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const referenceAdminRolesUsersInput = jsonObject({
	"roleId": misskeyId,
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
});
export const referenceAdminRolesUsersOutput = v.array(resultObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
		"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
		"user": packedReference("UserDetailed", { legacyOutputType: 'omit' }),
		"expiresAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	}));
export const referenceAdminRolesUsersDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/roles/users", tags: ["admin", "role", "users"] },
	referenceAdminRolesUsersInput,
	referenceAdminRolesUsersOutput,
);

export const referenceEndpointDefinitions = {
	"admin/roles/users": referenceAdminRolesUsersDefinition,
} as const;

export const referenceEndpointContracts = {
	"admin/roles/users": referenceAdminRolesUsersDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof referenceEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof referenceEndpointContracts>;
export type ReferenceEndpoints = {
	[K in keyof typeof referenceEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
