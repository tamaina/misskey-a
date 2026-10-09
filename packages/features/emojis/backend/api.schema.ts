/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

export const emojiSimpleResult = v.strictObject({
	aliases: v.array(v.string()),
	name: v.string(),
	category: v.nullable(v.string()),
	url: v.string(),
	localOnly: v.optional(v.boolean()),
	isSensitive: v.optional(v.boolean()),
	roleIdsThatCanBeUsedThisEmojiAsReaction: v.optional(v.array(v.string())),
});

export const emojiDetailedResult = v.strictObject({
	id: v.string(),
	aliases: v.array(v.string()),
	name: v.string(),
	category: v.nullable(v.string()),
	host: v.pipe(v.nullable(v.string()), v.metadata({ description: 'The local host is represented with `null`.' })),
	url: v.string(),
	license: v.nullable(v.string()),
	isSensitive: v.boolean(),
	localOnly: v.boolean(),
	roleIdsThatCanBeUsedThisEmojiAsReaction: v.array(v.string()),
});

export const packedEmojiDetailedAdminSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'updatedAt': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'date-time' })),
	'name': v.string(),
	'host': v.pipe(v.nullable(v.string()), v.metadata({ 'description': 'The local host is represented with `null`.' })),
	'publicUrl': v.string(),
	'originalUrl': v.string(),
	'uri': v.nullable(v.string()),
	'type': v.nullable(v.string()),
	'aliases': v.array(v.pipe(v.string(), v.metadata({ 'format': 'id' }))),
	'category': v.nullable(v.string()),
	'license': v.nullable(v.string()),
	'localOnly': v.boolean(),
	'isSensitive': v.boolean(),
	'roleIdsThatCanBeUsedThisEmojiAsReaction': v.array(v.strictObject({
		'id': v.pipe(v.string(), v.metadata({ 'format': 'misskey:id' })),
		'name': v.string(),
	})),
});

export const fetchEmojisHostTypes = [
	'local',
	'remote',
	'all',
] as const;

export const fetchEmojisSortKeys = [
	'+id',
	'-id',
	'+updatedAt',
	'-updatedAt',
	'+name',
	'-name',
	'+host',
	'-host',
	'+uri',
	'-uri',
	'+publicUrl',
	'-publicUrl',
	'+type',
	'-type',
	'+aliases',
	'-aliases',
	'+category',
	'-category',
	'+license',
	'-license',
	'+isSensitive',
	'-isSensitive',
	'+localOnly',
	'-localOnly',
	'+roleIdsThatCanBeUsedThisEmojiAsReaction',
	'-roleIdsThatCanBeUsedThisEmojiAsReaction',
] as const;

export type EmojiSimple = v.InferOutput<typeof emojiSimpleResult>;
export type EmojiDetailed = v.InferOutput<typeof emojiDetailedResult>;
