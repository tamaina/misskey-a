/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { EmojiSimple } from '../backend/api.schema.js';

export function searchEmojiCatalog(emojis: EmojiSimple[], query: string | null): EmojiSimple[] | null {
	if (query === '' || query == null) return null;

	const queryTokens = query.match(/\:([a-z0-9_]*)\:/g);
	if (queryTokens) {
		return emojis.filter(emoji => queryTokens.includes(`:${emoji.name}:`));
	}

	return emojis.filter(emoji => emoji.name.includes(query) || emoji.aliases.includes(query));
}
