/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId } from '../../api/contract/index.js';

export const voidAdminAdDeleteInput = v.object({
	"id": misskeyId,
});
export const voidAdminAdDeleteOutput = v.void();
export const voidAdminAdDeleteDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/ad/delete", tags: ["admin"] },
	voidAdminAdDeleteInput,
	voidAdminAdDeleteOutput,
);

export const voidAdminAdUpdateInput = v.object({
	"id": misskeyId,
	"memo": v.exactOptional(v.string()),
	"url": v.exactOptional(jsonString({ "minLength": 1 })),
	"imageUrl": v.exactOptional(jsonString({ "minLength": 1 })),
	"place": v.exactOptional(v.string()),
	"priority": v.exactOptional(v.string()),
	"ratio": v.exactOptional(v.pipe(v.number(), v.integer())),
	"expiresAt": v.exactOptional(v.pipe(v.number(), v.integer())),
	"startsAt": v.exactOptional(v.pipe(v.number(), v.integer())),
	"dayOfWeek": v.exactOptional(v.pipe(v.number(), v.integer())),
	"isSensitive": v.exactOptional(v.boolean()),
});
export const voidAdminAdUpdateOutput = v.void();
export const voidAdminAdUpdateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/ad/update", tags: ["admin"] },
	voidAdminAdUpdateInput,
	voidAdminAdUpdateOutput,
);

export const voidEndpointDefinitions = {
	"admin/ad/delete": voidAdminAdDeleteDefinition,
	"admin/ad/update": voidAdminAdUpdateDefinition,
} as const;

export const voidEndpointContracts = {
	"admin/ad/delete": voidAdminAdDeleteDefinition.contract,
	"admin/ad/update": voidAdminAdUpdateDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof voidEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof voidEndpointContracts>;
export type NativeVoidEndpoints = {
	[K in keyof typeof voidEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
