/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const packedAdminEmojiAddInput = v.object({
	"name": v.pipe(v.string(), v.regex(new RegExp("^[a-zA-Z0-9_]+$"))),
	"fileId": misskeyId,
	"category": v.exactOptional(v.pipe(v.nullable(v.string()), v.metadata({ "description": "Use `null` to reset the category." }))),
	"aliases": v.exactOptional(v.array(v.string())),
	"license": v.exactOptional(v.nullable(v.string())),
	"isSensitive": v.exactOptional(v.boolean()),
	"localOnly": v.exactOptional(v.boolean()),
	"roleIdsThatCanBeUsedThisEmojiAsReaction": v.exactOptional(v.array(v.string())),
});
export const packedAdminEmojiAddOutput = packedReference("EmojiDetailed");
export const packedAdminEmojiAddDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/emoji/add", tags: ["admin"] },
	packedAdminEmojiAddInput,
	packedAdminEmojiAddOutput,
);

export const packedAdminEmojiListInput = v.object({
	"query": v.optional(v.nullable(v.string()), null),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedAdminEmojiListOutput = v.array(packedReference("EmojiDetailed"));
export const packedAdminEmojiListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/emoji/list", tags: ["admin"] },
	packedAdminEmojiListInput,
	packedAdminEmojiListOutput,
);

export const packedAdminEmojiListRemoteInput = v.object({
	"query": v.optional(v.nullable(v.string()), null),
	"host": v.optional(v.pipe(v.nullable(v.string()), v.metadata({ "description": "Use `null` to represent the local host." })), null),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedAdminEmojiListRemoteOutput = v.array(packedReference("EmojiDetailed"));
export const packedAdminEmojiListRemoteDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/emoji/list-remote", tags: ["admin"] },
	packedAdminEmojiListRemoteInput,
	packedAdminEmojiListRemoteOutput,
);

export const packedEndpointDefinitions = {
	"admin/emoji/add": packedAdminEmojiAddDefinition,
	"admin/emoji/list": packedAdminEmojiListDefinition,
	"admin/emoji/list-remote": packedAdminEmojiListRemoteDefinition,
} as const;

export const packedEndpointContracts = {
	"admin/emoji/add": packedAdminEmojiAddDefinition.contract,
	"admin/emoji/list": packedAdminEmojiListDefinition.contract,
	"admin/emoji/list-remote": packedAdminEmojiListRemoteDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
