/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import type { EmojiSimple } from '../contract/index.js';
import { searchEmojiCatalog } from './search.js';

function emoji(name: string, aliases: string[] = []): EmojiSimple {
	return { name, aliases, category: null, url: `https://example.test/${name}.png` };
}

describe('searchEmojiCatalog', () => {
	test.each(['', null])('returns null for an empty query (%s)', query => {
		expect(searchEmojiCatalog([emoji('wave')], query)).toBeNull();
	});

	test('uses case-sensitive name substrings and exact aliases in source order', () => {
		const emojis = [
			emoji('star_bright', ['shiny']),
			emoji('blue-star', ['star']),
			emoji('star', ['stars']),
			emoji('Star', ['upper']),
		];

		expect(searchEmojiCatalog(emojis, 'star')).toEqual(emojis.slice(0, 3));
		expect(searchEmojiCatalog(emojis, 'shiny')).toEqual([emojis[0]]);
		expect(searchEmojiCatalog(emojis, 'hin')).toEqual([]);
		expect(searchEmojiCatalog(emojis, 'STAR')).toEqual([]);
	});

	test('uses exact lowercase colon tokens and preserves catalog order', () => {
		const emojis = [emoji('two'), emoji('one'), emoji('three')];

		expect(searchEmojiCatalog(emojis, 'find :one: and :two:')).toEqual([emojis[0], emojis[1]]);
		expect(searchEmojiCatalog(emojis, 'find :missing:')).toEqual([]);
		expect(searchEmojiCatalog(emojis, ':ONE:')).toEqual([]);
	});

	test('retains the empty-name match permitted by the colon-token regex', () => {
		const emptyName = emoji('');

		expect(searchEmojiCatalog([emptyName, emoji('wave')], '::')).toEqual([emptyName]);
	});
});
