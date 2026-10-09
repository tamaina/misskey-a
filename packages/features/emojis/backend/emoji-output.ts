/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { emojiSimpleResult, emojiDetailedResult, packedEmojiDetailedAdminSchema } from './api.definition.js';

export function toEmojiSimple(emoji: v.InferOutput<typeof emojiSimpleResult>): v.InferOutput<typeof emojiSimpleResult> {
	return {
		aliases: [...emoji.aliases], name: emoji.name, category: emoji.category, url: emoji.url,
		...(emoji.localOnly === undefined ? {} : { localOnly: emoji.localOnly }),
		...(emoji.isSensitive === undefined ? {} : { isSensitive: emoji.isSensitive }),
		...(emoji.roleIdsThatCanBeUsedThisEmojiAsReaction === undefined ? {} : { roleIdsThatCanBeUsedThisEmojiAsReaction: [...emoji.roleIdsThatCanBeUsedThisEmojiAsReaction] }),
	};
}
export function toEmojiDetailed(emoji: v.InferOutput<typeof emojiDetailedResult>): v.InferOutput<typeof emojiDetailedResult> {
	return {
		id: emoji.id, aliases: [...emoji.aliases], name: emoji.name, category: emoji.category,
		host: emoji.host, url: emoji.url, license: emoji.license, isSensitive: emoji.isSensitive,
		localOnly: emoji.localOnly, roleIdsThatCanBeUsedThisEmojiAsReaction: [...emoji.roleIdsThatCanBeUsedThisEmojiAsReaction],
	};
}
export function toEmojiDetailedAdmin(emoji: v.InferOutput<typeof packedEmojiDetailedAdminSchema>): v.InferOutput<typeof packedEmojiDetailedAdminSchema> {
	return {
		id: emoji.id, updatedAt: emoji.updatedAt, name: emoji.name, host: emoji.host,
		publicUrl: emoji.publicUrl, originalUrl: emoji.originalUrl, uri: emoji.uri, type: emoji.type,
		aliases: [...emoji.aliases], category: emoji.category, license: emoji.license,
		localOnly: emoji.localOnly, isSensitive: emoji.isSensitive,
		roleIdsThatCanBeUsedThisEmojiAsReaction: emoji.roleIdsThatCanBeUsedThisEmojiAsReaction.map(role => ({ id: role.id, name: role.name })),
	};
}
