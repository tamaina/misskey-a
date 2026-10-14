/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { parse } from 'vue/compiler-sfc';
import { restoreUpstreamDevelopBaseline, restoreUpstreamLocaleBundle } from './upstream-develop-source-rebase.js';
import rebases from './upstream-develop-source-rebase.json';
import translations from './upstream-develop-locale-updates.json';

const root = resolve(import.meta.dirname, '../../../..');
const hash = (source: string): string => createHash('sha256').update(source).digest('hex');
const dictionaries = (source: string): Map<string, Record<string, unknown>> => new Map(parse(source).descriptor.customBlocks.filter(block => block.type === 'locale').map(block => [String(block.attrs.locale), JSON.parse(block.content)]));

for (const entry of rebases) {
	test(`upstream adaptations restore exact frozen source: ${entry.file}`, () => {
		const current = readFileSync(resolve(root, entry.file), 'utf8');
		const baseline = restoreUpstreamDevelopBaseline(entry.file, current);
		expect(hash(current)).toBe(entry.currentSha256);
		expect(hash(baseline)).toBe(entry.baselineSha256);
		expect(restoreUpstreamDevelopBaseline(entry.file, baseline)).toBe(baseline);
		expect(() => restoreUpstreamDevelopBaseline(entry.file, current + '\n')).toThrow('Source differs');
		if (entry.file.endsWith('.vue')) {
			const before = dictionaries(baseline);
			const after = dictionaries(current);
			expect([...after.keys()]).toEqual([...before.keys()]);
			for (const [language, dictionary] of before) {
				const actual = after.get(language)!;
				for (const [key, value] of Object.entries(dictionary)) {
					const changes = translations.changes.filter(change => change.file === entry.file).flatMap(change => change.updates).filter(change => change.language === language && change.localKey === key);
					if (changes.length) expect(actual[key]).toBe(changes[0].after);
					else if (key === 'deckColumnsLabels') expect({ ...actual[key] as object, clip: undefined }).toEqual({ ...value as object, clip: undefined });
					else expect(actual[key]).toEqual(value);
				}
			}
		}
	});
}

test('all imported Crowdin changes are explicit and retain the source text as historical evidence', () => {
	expect(translations.upstream).toBe('4ae9364dfca718f0cc7b596711dcdd594528a39b');
	expect(translations.changes.reduce((total, change) => total + change.updates.length, 0)).toBe(80);
	for (const change of translations.changes) {
		const source = readFileSync(resolve(root, change.file), 'utf8');
		const before = dictionaries(restoreUpstreamDevelopBaseline(change.file, source));
		const after = dictionaries(source);
		for (const update of change.updates) {
			expect(before.get(update.language)?.[update.localKey]).toBe(update.before);
			expect(after.get(update.language)?.[update.localKey]).toBe(update.after);
		}
	}
});

test('new clip column dictionaries cover the same active locales as Deck', () => {
	const column = dictionaries(readFileSync(resolve(root, 'packages/features/collections/frontend/ui/deck/clip-column.vue'), 'utf8'));
	const deck = dictionaries(readFileSync(resolve(root, 'packages/features/navigation/frontend/ui/deck.vue'), 'utf8'));
	expect([...column.keys()]).toEqual([...deck.keys()]);
	for (const [language, values] of column) {
		expect(Object.keys(values)).toEqual(['clip', 'selectClip', 'clips', 'favorites', 'show']);
		expect(values.clip).toBe((deck.get(language)?.deckColumnsLabels as Record<string, string>).clip);
	}
});

test('live locale bundle restoration rejects new or altered keys and preserves unrelated modules', () => {
	const file = 'packages/features/navigation/frontend/ui/deck.vue';
	const source = readFileSync(resolve(root, file), 'utf8');
	const moduleId = file.replace('packages/', '/');
	const current = dictionaries(source).get('ja-JP')!;
	const baseline = dictionaries(restoreUpstreamDevelopBaseline(file, source)).get('ja-JP')!;
	const global = { preserved: 'global' };
	const unrelated = { preserved: 'module' };
	const bundle = { global, modules: { [moduleId]: structuredClone(current), '/synthetic/unrelated': unrelated } };
	expect(restoreUpstreamLocaleBundle('ja-JP', bundle)).toBe(bundle);
	expect(bundle.modules[moduleId]).toEqual(baseline);
	expect(bundle.global).toBe(global);
	expect(bundle.modules['/synthetic/unrelated']).toBe(unrelated);
	for (const invalid of [{ ...current, future: 'extra' }, { ...current, addColumn: 'altered' }]) {
		expect(() => restoreUpstreamLocaleBundle('ja-JP', { modules: { [moduleId]: invalid } })).toThrow('Locale loader differs');
	}
});
