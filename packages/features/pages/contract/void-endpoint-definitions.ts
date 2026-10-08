/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';

export const voidPagePushInput = v.object({
	"pageId": misskeyId,
	"event": v.string(),
	"var": v.exactOptional(v.unknown()),
});
export const voidPagePushOutput = v.void();
export const voidPagePushDefinition = defineEndpointContract(
	{ method: 'POST', path: "/page-push" },
	voidPagePushInput,
	voidPagePushOutput,
);

export const voidPagesDeleteInput = v.object({
	"pageId": misskeyId,
});
export const voidPagesDeleteOutput = v.void();
export const voidPagesDeleteDefinition = defineEndpointContract(
	{ method: 'POST', path: "/pages/delete", tags: ["pages"] },
	voidPagesDeleteInput,
	voidPagesDeleteOutput,
);

export const voidPagesLikeInput = v.object({
	"pageId": misskeyId,
});
export const voidPagesLikeOutput = v.void();
export const voidPagesLikeDefinition = defineEndpointContract(
	{ method: 'POST', path: "/pages/like", tags: ["pages"] },
	voidPagesLikeInput,
	voidPagesLikeOutput,
);

export const voidPagesUnlikeInput = v.object({
	"pageId": misskeyId,
});
export const voidPagesUnlikeOutput = v.void();
export const voidPagesUnlikeDefinition = defineEndpointContract(
	{ method: 'POST', path: "/pages/unlike", tags: ["pages"] },
	voidPagesUnlikeInput,
	voidPagesUnlikeOutput,
);

export const voidEndpointDefinitions = {
	"page-push": voidPagePushDefinition,
	"pages/delete": voidPagesDeleteDefinition,
	"pages/like": voidPagesLikeDefinition,
	"pages/unlike": voidPagesUnlikeDefinition,
} as const;

export const voidEndpointContracts = {
	"page-push": voidPagePushDefinition.contract,
	"pages/delete": voidPagesDeleteDefinition.contract,
	"pages/like": voidPagesLikeDefinition.contract,
	"pages/unlike": voidPagesUnlikeDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof voidEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof voidEndpointContracts>;
export type NativeVoidEndpoints = {
	[K in keyof typeof voidEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
