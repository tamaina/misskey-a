/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { load } from 'js-yaml';
import { languages, locales as currentLocales } from 'i18n';
import { expect, test } from 'vitest';
import baseline from './retired-ui-locale-baseline.json';
import { locales, valueAt, verifyRetiredUiBaseline, verifyRetiredUiLanguages } from './retired-ui-locale-baseline.js';

const root = resolve(import.meta.dirname, '../../../..');
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

function flatten(dictionary: Record<string, unknown>, prefix = '', pairs: [string, unknown][] = []): [string, unknown][] {
	for (const [key, value] of Object.entries(dictionary)) {
		const path = prefix ? `${prefix}.${key}` : key;
		if (value && typeof value === 'object') flatten(value as Record<string, unknown>, path, pairs);
		else pairs.push([path, value]);
	}
	return pairs.sort(([a], [b]) => a.localeCompare(b));
}

test('retired UI values retain their independent original effective-catalog hashes', () => {
	expect(baseline.mappings).toHaveLength(263);
	expect(baseline.owners).toHaveLength(38);
	expect(Object.keys(baseline.sha256)).toEqual(languages);
	for (const language of languages) {
		const pairs = baseline.mappings.map((mapping): [string, string] => [String(mapping[0]), String(valueAt(locales[language], String(mapping[0])))]);
		expect(hash(pairs)).toBe(baseline.sha256[language]);
		for (const [path] of pairs) expect(valueAt(currentLocales[language], path)).toBeUndefined();
	}
	for (const file of readdirSync(resolve(root, 'locales')).filter(file => file.endsWith('.yml'))) {
		const raw = load(readFileSync(resolve(root, 'locales', file), 'utf8').replaceAll('\b', '')) ?? {};
		for (const mapping of baseline.mappings) expect(valueAt(raw, String(mapping[0]))).toBeUndefined();
	}
});

test('inactive-language translations are preserved byte-for-byte as YAML values', () => {
	let total = 0;
	for (const [language, frozen] of Object.entries(baseline.inactive)) {
		const raw = (load(readFileSync(resolve(root, 'locales', `${language}.yml`), 'utf8').replaceAll('\b', '')) ?? {}) as Record<string, unknown>;
		const selected = Object.fromEntries(baseline.inactiveNamespaces.filter(namespace => raw[namespace] !== undefined).map(namespace => [namespace, raw[namespace]]));
		const pairs = flatten(selected);
		expect(pairs).toHaveLength(frozen.count);
		expect(hash(pairs)).toBe(frozen.sha256);
		total += pairs.length;
	}
	expect(total).toBe(219);
});

test('changed text, key inventories and languages cannot approve their own baseline', () => {
	const pairs = baseline.mappings.map((mapping): [string, string] => [String(mapping[0]), String(valueAt(locales['ja-JP'], String(mapping[0])))]);
	expect(() => verifyRetiredUiBaseline('ja-JP', pairs)).not.toThrow();
	const changed = pairs.map((pair): [string, string] => [...pair]);
	changed[0][1] += ' changed';
	expect(() => verifyRetiredUiBaseline('ja-JP', changed)).toThrow('UI text differs from frozen catalog');
	expect(() => verifyRetiredUiBaseline('ja-JP', pairs.slice(1))).toThrow('Invalid retired UI key inventory');
	expect(() => verifyRetiredUiBaseline('unknown', pairs)).toThrow('UI text differs from frozen catalog');
	expect(() => verifyRetiredUiLanguages([...languages, 'bn-BD'])).toThrow('Frozen UI language inventory differs');
	expect(() => verifyRetiredUiLanguages(languages.slice(1))).toThrow('Frozen UI language inventory differs');
});
