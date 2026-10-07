/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { jsonSelectorUnion, jsonSelectorAndCommon } from '../../api/contract/json-selector-and-common.js';
import { misskeyId, jsonString } from '../../api/contract/index.js';

export const allOfAdminEmojiUpdateSelector = jsonSelectorUnion([
	jsonObject({
		id: misskeyId,
	}),
	jsonObject({
		name: jsonString({ "pattern": "^[a-zA-Z0-9_]+$" }),
	}),
]);
export const allOfAdminEmojiUpdateCommon = jsonObject({
	fileId: v.optional(misskeyId),
	category: v.optional(v.pipe(v.nullable(v.string()), v.metadata({ "description": "Use `null` to reset the category." }))),
	aliases: v.optional(v.array(v.string())),
	license: v.optional(v.nullable(v.string())),
	isSensitive: v.optional(v.boolean()),
	localOnly: v.optional(v.boolean()),
	roleIdsThatCanBeUsedThisEmojiAsReaction: v.optional(v.array(v.string())),
});
export const allOfAdminEmojiUpdateInput = jsonSelectorAndCommon(allOfAdminEmojiUpdateSelector, allOfAdminEmojiUpdateCommon);
export const allOfAdminEmojiUpdateOutput = v.void();
export const allOfAdminEmojiUpdateDefinition = defineEndpointContract(
	{ method: 'POST', path: '/admin/emoji/update', tags: ["admin"] },
	allOfAdminEmojiUpdateInput,
	allOfAdminEmojiUpdateOutput,
);

export const selectorCommonEndpointDefinitions = {
	'admin/emoji/update': allOfAdminEmojiUpdateDefinition,
} as const;

export const selectorCommonEndpointContracts = {
	'admin/emoji/update': allOfAdminEmojiUpdateDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof selectorCommonEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof selectorCommonEndpointContracts>;
export type SelectorCommonEndpoints = {
	[K in keyof typeof selectorCommonEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
