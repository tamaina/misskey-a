/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createProcedureClient, implement } from '@orpc/server';
import type { JsonSchema } from '@valibot/to-json-schema';
import {
	emojiDetailedResult,
	emojiInput,
	emojisContract,
	emojisResult,
	emojiSimpleResult,
} from '../contract/index.js';
import type { EmojiDetailed, EmojiEndpoints, EmojiSimple } from '../contract/index.js';
import { objectParams } from '../../api/contract/index.js';
import { toLegacyJsonSchema } from '../../api/backend/index.js';

export interface EmojisDependencies {
	listLocal(): Promise<EmojiSimple[]>;
	findLocal(name: string): Promise<EmojiDetailed>;
}

export function createEmojis(deps: EmojisDependencies) {
	const emojis = createProcedureClient(implement(emojisContract.emojis).handler(async () => ({
		// Legacy packers use own undefined properties; JSON omits them on the wire.
		emojis: (await deps.listLocal()).map(emoji => {
			const result = { ...emoji };
			if (result.localOnly === undefined) delete result.localOnly;
			if (result.isSensitive === undefined) delete result.isSensitive;
			if (result.roleIdsThatCanBeUsedThisEmojiAsReaction === undefined) delete result.roleIdsThatCanBeUsedThisEmojiAsReaction;
			return result;
		}),
	}) satisfies EmojiEndpoints['emojis']['res']));

	const emoji = createProcedureClient(implement(emojisContract.emoji).handler(async ({ input }) =>
		deps.findLocal(input.name) satisfies Promise<EmojiEndpoints['emoji']['res']>));

	return { emojis, emoji };
}

export type EmojisFeature = ReturnType<typeof createEmojis>;

export const legacyEmojiSimpleSchema = toLegacyJsonSchema(emojiSimpleResult, { target: 'openapi-3.0' });
export const legacyEmojiDetailedSchema = toLegacyJsonSchema(emojiDetailedResult, { target: 'openapi-3.0' });

const legacyEmojisInput = toLegacyJsonSchema(objectParams);
const legacyEmojisOutput = toLegacyJsonSchema(emojisResult, {
	target: 'openapi-3.0',
	overrideSchema: ({ valibotSchema }) => valibotSchema === emojiSimpleResult
		? { type: 'object', ref: 'EmojiSimple' }
		: undefined,
});
export const legacyEmojisSchemas: { input: JsonSchema; output: JsonSchema } = {
	input: legacyEmojisInput,
	output: legacyEmojisOutput,
};

const legacyEmojiInput = toLegacyJsonSchema(emojiInput);
const legacyEmojiOutput = toLegacyJsonSchema(emojiDetailedResult, {
	target: 'openapi-3.0',
	overrideSchema: ({ valibotSchema }) => valibotSchema === emojiDetailedResult
		? { type: 'object', ref: 'EmojiDetailed' }
		: undefined,
});
export const legacyEmojiSchemas: { input: JsonSchema; output: JsonSchema } = {
	input: legacyEmojiInput,
	output: legacyEmojiOutput,
};
