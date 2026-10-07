/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const packedAdminAccountsFindByEmailInput = v.looseObject({
	"email": v.string(),
});
export const packedAdminAccountsFindByEmailOutput = packedReference("UserDetailedNotMe");
export const packedAdminAccountsFindByEmailDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/accounts/find-by-email", tags: ["admin"] },
	packedAdminAccountsFindByEmailInput,
	packedAdminAccountsFindByEmailOutput,
);

export const packedIInput = v.looseObject({});
export const packedIOutput = packedReference("MeDetailed");
export const packedIDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i", tags: ["account"] },
	packedIInput,
	packedIOutput,
);

export const packedUsersInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"offset": v.optional(v.pipe(v.number(), v.integer()), 0),
	"sort": v.exactOptional(v.picklist(["+follower", "-follower", "+createdAt", "-createdAt", "+updatedAt", "-updatedAt"])),
	"state": v.optional(v.picklist(["all", "alive"]), "all"),
	"origin": v.optional(v.picklist(["combined", "local", "remote"]), "local"),
	"hostname": v.optional(v.pipe(v.nullable(v.string()), v.metadata({ "description": "The local host is represented with `null`." })), null),
});
export const packedUsersOutput = v.array(packedReference("UserDetailed"));
export const packedUsersDefinition = defineEndpointContract(
	{ method: 'POST', path: "/users", tags: ["users"] },
	packedUsersInput,
	packedUsersOutput,
);

export const packedEndpointDefinitions = {
	"admin/accounts/find-by-email": packedAdminAccountsFindByEmailDefinition,
	"i": packedIDefinition,
	"users": packedUsersDefinition,
} as const;

export const packedEndpointContracts = {
	"admin/accounts/find-by-email": packedAdminAccountsFindByEmailDefinition.contract,
	"i": packedIDefinition.contract,
	"users": packedUsersDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
