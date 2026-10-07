/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';
import { resultObject } from '../../api/contract/result-object.js';

export const inlineAdminEmojiCopyInput = v.looseObject({
	"emojiId": misskeyId,
});
export const inlineAdminEmojiCopyOutput = resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
});
export const inlineAdminEmojiCopyDefinition = defineEndpointContract(
	{ method: 'POST', path: '/admin/emoji/copy', tags: ["admin"] },
	inlineAdminEmojiCopyInput,
	inlineAdminEmojiCopyOutput,
);

export const inlineEndpointDefinitions = {
	"admin/emoji/copy": inlineAdminEmojiCopyDefinition,
} as const;

export const inlineEndpointContracts = {
	"admin/emoji/copy": inlineAdminEmojiCopyDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof inlineEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof inlineEndpointContracts>;
export type NativeInlineEndpoints = {
	[K in keyof typeof inlineEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
