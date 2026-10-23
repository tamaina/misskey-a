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
import baseline from './retired-ui-next-locale-baseline.json';
import { locales, valueAt, verifyRetiredUiNextBaseline, verifyRetiredUiNextLanguages } from './retired-ui-next-locale-baseline.js';

const root = resolve(import.meta.dirname, '../../../..');
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('retired next UI values retain independent original effective-catalog hashes', () => {
	expect(baseline.mappings).toHaveLength(789);
	expect(baseline.owners).toHaveLength(215);
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

test('changed next UI text, keys and languages cannot approve their own baseline', () => {
	const pairs = baseline.mappings.map((mapping): [string, string] => [String(mapping[0]), String(valueAt(locales['ja-JP'], String(mapping[0])))]);
	expect(() => verifyRetiredUiNextBaseline('ja-JP', pairs)).not.toThrow();
	const changed = pairs.map((pair): [string, string] => [...pair]);
	changed[0][1] += ' changed';
	expect(() => verifyRetiredUiNextBaseline('ja-JP', changed)).toThrow('Next UI text differs from frozen catalog');
	expect(() => verifyRetiredUiNextBaseline('ja-JP', pairs.slice(1))).toThrow('Invalid retired next UI key inventory');
	expect(() => verifyRetiredUiNextBaseline('unknown', pairs)).toThrow('Next UI text differs from frozen catalog');
	expect(() => verifyRetiredUiNextLanguages([...languages, 'bn-BD'])).toThrow('Frozen next UI language inventory differs');
	expect(() => verifyRetiredUiNextLanguages(languages.slice(1))).toThrow('Frozen next UI language inventory differs');
});
