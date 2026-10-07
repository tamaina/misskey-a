/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId } from '../../api/contract/index.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const packedAdminAdCreateInput = v.object({
	"url": jsonString({ "minLength": 1 }),
	"memo": v.string(),
	"place": v.string(),
	"priority": v.string(),
	"ratio": v.pipe(v.number(), v.integer()),
	"expiresAt": v.pipe(v.number(), v.integer()),
	"startsAt": v.pipe(v.number(), v.integer()),
	"imageUrl": jsonString({ "minLength": 1 }),
	"dayOfWeek": v.pipe(v.number(), v.integer()),
	"isSensitive": v.exactOptional(v.boolean()),
});
export const packedAdminAdCreateOutput = packedReference("Ad");
export const packedAdminAdCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/ad/create", tags: ["admin"] },
	packedAdminAdCreateInput,
	packedAdminAdCreateOutput,
);

export const packedAdminAdListInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"publishing": v.optional(v.nullable(v.boolean()), null),
});
export const packedAdminAdListOutput = v.array(packedReference("Ad"));
export const packedAdminAdListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/ad/list", tags: ["admin"] },
	packedAdminAdListInput,
	packedAdminAdListOutput,
);

export const packedPinnedUsersInput = v.object({});
export const packedPinnedUsersOutput = v.array(packedReference("UserDetailed"));
export const packedPinnedUsersDefinition = defineEndpointContract(
	{ method: 'POST', path: "/pinned-users", tags: ["users"] },
	packedPinnedUsersInput,
	packedPinnedUsersOutput,
);

export const packedEndpointDefinitions = {
	"admin/ad/create": packedAdminAdCreateDefinition,
	"admin/ad/list": packedAdminAdListDefinition,
	"pinned-users": packedPinnedUsersDefinition,
} as const;

export const packedEndpointContracts = {
	"admin/ad/create": packedAdminAdCreateDefinition.contract,
	"admin/ad/list": packedAdminAdListDefinition.contract,
	"pinned-users": packedPinnedUsersDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
