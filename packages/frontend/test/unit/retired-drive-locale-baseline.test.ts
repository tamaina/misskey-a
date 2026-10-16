/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { languages, locales as currentLocales } from 'i18n';
import { expect, test } from 'vitest';
import { locales, verifyRetiredDriveBaseline, verifyRetiredDriveLanguages } from './retired-drive-locale-baseline.js';
import baseline from './retired-drive-locale-baseline.json';

function at(dictionary: unknown, path: string): unknown {
	for (const part of path.split('.')) {
		if (!dictionary || typeof dictionary !== 'object') return undefined;
		dictionary = Reflect.get(dictionary, part);
	}
	return dictionary;
}

test('retired drive text remains independently frozen without restoring production keys', () => {
	expect(baseline.mappings).toHaveLength(55);
	expect(Object.keys(baseline.sha256)).toEqual(languages);
	for (const language of languages) {
		const pairs = baseline.mappings.map(mapping => [mapping.global, at(locales[language], mapping.global)]);
		expect(createHash('sha256').update(JSON.stringify(pairs)).digest('hex')).toBe(baseline.sha256[language]);
		for (const mapping of baseline.mappings) {
			expect(at(currentLocales[language], mapping.global)).toBeUndefined();
			expect(typeof at(locales[language], mapping.global)).toBe('string');
		}
		for (const key of ['scale', 'size', 'color', 'opacity', 'lightness', 'offset']) {
			const path = `_imageEffector._fxProps.${key}`;
			expect(at(locales[language], path)).toBe(at(currentLocales[language], path));
		}
	}
});

test('owner text edits and expanded language inventories cannot approve themselves', () => {
	const pairs = baseline.mappings.map((mapping): [string, string] => [mapping.global, String(at(locales['ja-JP'], mapping.global))]);
	expect(() => verifyRetiredDriveBaseline('ja-JP', pairs)).not.toThrow();
	const changed = pairs.map((pair): [string, string] => [...pair]);
	changed[0][1] += ' changed';
	expect(() => verifyRetiredDriveBaseline('ja-JP', changed)).toThrow('Drive text differs from frozen catalog');
	expect(() => verifyRetiredDriveBaseline('ja-JP', pairs.slice(1))).toThrow('Invalid retired drive key inventory');
	expect(() => verifyRetiredDriveLanguages([...languages, 'bn-BD'])).toThrow('Frozen drive language inventory differs');
	expect(() => verifyRetiredDriveLanguages(languages.slice(1))).toThrow('Frozen drive language inventory differs');
});
