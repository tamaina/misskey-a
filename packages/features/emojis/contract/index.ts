/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { objectParams } from '../../api/contract/index.js';

const emojiId = v.pipe(v.string(), v.metadata({ format: 'id' }));

export const emojiSimpleResult = v.object({
	aliases: v.array(emojiId),
	name: v.string(),
	category: v.nullable(v.string()),
	url: v.string(),
	localOnly: v.pipe(v.exactOptional(v.boolean()), v.metadata({ optional: true })),
	isSensitive: v.pipe(v.exactOptional(v.boolean()), v.metadata({ optional: true })),
	roleIdsThatCanBeUsedThisEmojiAsReaction: v.pipe(v.exactOptional(v.array(emojiId)), v.metadata({ optional: true })),
});

export const emojiDetailedResult = v.object({
	id: emojiId,
	aliases: v.array(emojiId),
	name: v.string(),
	category: v.nullable(v.string()),
	host: v.pipe(v.nullable(v.string()), v.metadata({ description: 'The local host is represented with `null`.' })),
	url: v.string(),
	license: v.nullable(v.string()),
	isSensitive: v.boolean(),
	localOnly: v.boolean(),
	roleIdsThatCanBeUsedThisEmojiAsReaction: v.array(emojiId),
});

export type EmojiSimple = v.InferOutput<typeof emojiSimpleResult>;
export type EmojiDetailed = v.InferOutput<typeof emojiDetailedResult>;
export type EmojiPacked = {
	EmojiSimple: EmojiSimple;
	EmojiDetailed: EmojiDetailed;
};

export const emojisResult = v.object({ emojis: v.array(emojiSimpleResult) });
export const emojiInput = v.object({ name: v.string() });

export const emojisContract = {
	emojis: oc.route({ method: 'POST', path: '/emojis', tags: ['meta'] })
		.input(v.optional(objectParams, {}))
		.output(emojisResult),
	emoji: oc.route({ method: 'POST', path: '/emoji', tags: ['meta'] })
		.input(emojiInput)
		.output(emojiDetailedResult),
};

type Inputs = InferContractRouterInputs<typeof emojisContract>;
type Outputs = InferContractRouterOutputs<typeof emojisContract>;
export type EmojiEndpoints = {
	[K in keyof typeof emojisContract]: { req: Inputs[K]; res: Outputs[K] };
};
