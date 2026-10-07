/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';
import { resultObject } from '../../api/contract/result-object.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';
import { fetchEmojisHostTypes, fetchEmojisSortKeys } from './fetch-options.js';

export const portableV2AdminEmojiListInput = jsonObject({
	"query": v.exactOptional(v.pipe(v.nullable(jsonObject({
		"updatedAtFrom": v.exactOptional(v.string()),
		"updatedAtTo": v.exactOptional(v.string()),
		"name": v.exactOptional(v.string()),
		"host": v.exactOptional(v.string()),
		"uri": v.exactOptional(v.string()),
		"publicUrl": v.exactOptional(v.string()),
		"originalUrl": v.exactOptional(v.string()),
		"type": v.exactOptional(v.string()),
		"aliases": v.exactOptional(v.string()),
		"category": v.exactOptional(v.string()),
		"license": v.exactOptional(v.string()),
		"isSensitive": v.exactOptional(v.boolean()),
		"localOnly": v.exactOptional(v.boolean()),
		"hostType": v.optional(v.picklist(fetchEmojisHostTypes), "all"),
		"roleIds": v.exactOptional(v.array(misskeyId)),
	})), v.metadata({ "required": undefined }))),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
	"page": v.exactOptional(v.pipe(v.number(), v.integer())),
	"sortKeys": v.optional(v.array(v.picklist(fetchEmojisSortKeys)), ["-id"]),
});
export const portableV2AdminEmojiListOutput = resultObject({
	"emojis": v.array(packedReference("EmojiDetailedAdmin")),
	"count": v.pipe(v.number(), v.integer()),
	"allCount": v.pipe(v.number(), v.integer()),
	"allPages": v.pipe(v.number(), v.integer()),
});
export const portableV2AdminEmojiListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/v2/admin/emoji/list", tags: ["admin"] },
	portableV2AdminEmojiListInput,
	portableV2AdminEmojiListOutput,
);

export const portableConstantEndpointDefinitions = {
	"v2/admin/emoji/list": portableV2AdminEmojiListDefinition,
} as const;

export const portableConstantEndpointContracts = {
	"v2/admin/emoji/list": portableV2AdminEmojiListDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof portableConstantEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof portableConstantEndpointContracts>;
export type PortableConstantEndpoints = {
	[K in keyof typeof portableConstantEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
