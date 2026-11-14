/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import { searchEmoji } from '../../frontend/utility/search-emoji.js';

test('a custom emoji and a Unicode emoji may share a name without hiding either', () => {
	const unicode = { name: 'smile', emoji: '😄' };
	const custom = { name: 'smile', emoji: ':smile:', isCustomEmoji: true as const };
	const alias = { name: 'smile_alias', emoji: ':smile:', aliasOf: 'smile', isCustomEmoji: true as const };
	expect(searchEmoji('smile', [unicode, custom, alias])).toEqual([unicode, custom]);
	expect(searchEmoji('smi', [unicode, custom, alias])).toEqual([unicode, custom]);
});
