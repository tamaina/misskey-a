/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { misskeyId, objectParams } from '../../api/contract/index.js';

const emojiId = v.pipe(v.string(), v.metadata({ format: 'id' }));

export const emojiSimpleResult = v.strictObject({
	aliases: v.array(emojiId),
	name: v.string(),
	category: v.nullable(v.string()),
	url: v.string(),
	localOnly: v.pipe(v.optional(v.boolean()), v.metadata({ optional: true })),
	isSensitive: v.pipe(v.optional(v.boolean()), v.metadata({ optional: true })),
	roleIdsThatCanBeUsedThisEmojiAsReaction: v.pipe(v.optional(v.array(emojiId)), v.metadata({ optional: true })),
});

export const emojiDetailedResult = v.strictObject({
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

export const emojisResult = v.strictObject({ emojis: v.array(emojiSimpleResult) });
export const emojiInput = v.object({ name: v.string() });

const emojiIdsInput = v.array(misskeyId);
const emojiAliasesInput = v.array(v.string());

export const emojiAdministrationInputs = {
	'admin/emoji/set-category-bulk': v.object({
		ids: emojiIdsInput,
		category: v.pipe(v.exactOptional(v.nullable(v.string())), v.metadata({ description: 'Use `null` to reset the category.' })),
	}),
	'admin/emoji/set-license-bulk': v.object({
		ids: emojiIdsInput,
		license: v.pipe(v.exactOptional(v.nullable(v.string())), v.metadata({ description: 'Use `null` to reset the license.' })),
	}),
	'admin/emoji/set-aliases-bulk': v.object({ ids: emojiIdsInput, aliases: emojiAliasesInput }),
	'admin/emoji/add-aliases-bulk': v.object({ ids: emojiIdsInput, aliases: emojiAliasesInput }),
	'admin/emoji/remove-aliases-bulk': v.object({ ids: emojiIdsInput, aliases: emojiAliasesInput }),
};

const voidOutput = v.void();

export const emojisContract = {
	emojis: oc.route({ method: 'POST', path: '/emojis', tags: ['meta'] })
		.input(v.optional(objectParams, {}))
		.output(emojisResult),
	emoji: oc.route({ method: 'POST', path: '/emoji', tags: ['meta'] })
		.input(emojiInput)
		.output(emojiDetailedResult),
	'admin/emoji/set-category-bulk': oc.route({ method: 'POST', path: '/admin/emoji/set-category-bulk', tags: ['admin'] })
		.input(emojiAdministrationInputs['admin/emoji/set-category-bulk'])
		.output(voidOutput),
	'admin/emoji/set-license-bulk': oc.route({ method: 'POST', path: '/admin/emoji/set-license-bulk', tags: ['admin'] })
		.input(emojiAdministrationInputs['admin/emoji/set-license-bulk'])
		.output(voidOutput),
	'admin/emoji/set-aliases-bulk': oc.route({ method: 'POST', path: '/admin/emoji/set-aliases-bulk', tags: ['admin'] })
		.input(emojiAdministrationInputs['admin/emoji/set-aliases-bulk'])
		.output(voidOutput),
	'admin/emoji/add-aliases-bulk': oc.route({ method: 'POST', path: '/admin/emoji/add-aliases-bulk', tags: ['admin'] })
		.input(emojiAdministrationInputs['admin/emoji/add-aliases-bulk'])
		.output(voidOutput),
	'admin/emoji/remove-aliases-bulk': oc.route({ method: 'POST', path: '/admin/emoji/remove-aliases-bulk', tags: ['admin'] })
		.input(emojiAdministrationInputs['admin/emoji/remove-aliases-bulk'])
		.output(voidOutput),
};

type Inputs = InferContractRouterInputs<typeof emojisContract>;
type Outputs = InferContractRouterOutputs<typeof emojisContract>;
export type EmojiEndpoints = {
	[K in keyof typeof emojisContract]: { req: Inputs[K]; res: Outputs[K] };
};
