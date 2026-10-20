/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { parse } from 'vue/compiler-sfc';

const root = resolve(import.meta.dirname, '../../../..');
const dictionaries = (source: string): Map<string, Record<string, unknown>> => new Map(parse(source).descriptor.customBlocks.filter(block => block.type === 'locale').map(block => [String(block.attrs.locale), JSON.parse(block.content)]));

test('new clip column dictionaries cover the same active locales as Deck', () => {
	const column = dictionaries(readFileSync(resolve(root, 'packages/features/collections/frontend/ui/deck/clip-column.vue'), 'utf8'));
	const deck = dictionaries(readFileSync(resolve(root, 'packages/features/navigation/frontend/ui/deck.vue'), 'utf8'));
	expect([...column.keys()]).toEqual([...deck.keys()]);
	for (const [language, values] of column) {
		expect(Object.keys(values)).toEqual(['clip', 'selectClip', 'clips', 'favorites', 'show']);
		expect(values.clip).toBe((deck.get(language)?.deckColumnsLabels as Record<string, string>).clip);
	}
});
