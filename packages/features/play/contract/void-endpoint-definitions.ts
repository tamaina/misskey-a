/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';

export const voidFlashDeleteInput = v.looseObject({
	"flashId": misskeyId,
});
export const voidFlashDeleteOutput = v.void();
export const voidFlashDeleteDefinition = defineEndpointContract(
	{ method: 'POST', path: "/flash/delete", tags: ["flashs"] },
	voidFlashDeleteInput,
	voidFlashDeleteOutput,
);

export const voidFlashLikeInput = v.looseObject({
	"flashId": misskeyId,
});
export const voidFlashLikeOutput = v.void();
export const voidFlashLikeDefinition = defineEndpointContract(
	{ method: 'POST', path: "/flash/like", tags: ["flash"] },
	voidFlashLikeInput,
	voidFlashLikeOutput,
);

export const voidFlashUnlikeInput = v.looseObject({
	"flashId": misskeyId,
});
export const voidFlashUnlikeOutput = v.void();
export const voidFlashUnlikeDefinition = defineEndpointContract(
	{ method: 'POST', path: "/flash/unlike", tags: ["flash"] },
	voidFlashUnlikeInput,
	voidFlashUnlikeOutput,
);

export const voidFlashUpdateInput = v.looseObject({
	"flashId": misskeyId,
	"title": v.exactOptional(v.string()),
	"summary": v.exactOptional(v.string()),
	"script": v.exactOptional(v.string()),
	"permissions": v.exactOptional(v.array(v.string())),
	"visibility": v.exactOptional(v.picklist(["public", "private"])),
});
export const voidFlashUpdateOutput = v.void();
export const voidFlashUpdateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/flash/update", tags: ["flash"] },
	voidFlashUpdateInput,
	voidFlashUpdateOutput,
);

export const voidEndpointDefinitions = {
	"flash/delete": voidFlashDeleteDefinition,
	"flash/like": voidFlashLikeDefinition,
	"flash/unlike": voidFlashUnlikeDefinition,
	"flash/update": voidFlashUpdateDefinition,
} as const;

export const voidEndpointContracts = {
	"flash/delete": voidFlashDeleteDefinition.contract,
	"flash/like": voidFlashLikeDefinition.contract,
	"flash/unlike": voidFlashUnlikeDefinition.contract,
	"flash/update": voidFlashUpdateDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof voidEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof voidEndpointContracts>;
export type NativeVoidEndpoints = {
	[K in keyof typeof voidEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
