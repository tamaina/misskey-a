/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createApp } from 'vue';
import { parse } from 'vue/compiler-sfc';
import { expect, test } from 'vitest';
import { languages, locales as productionLocales } from 'i18n';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { createComponentLocale } from 'vite-vue-internationalization/runtime';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { I18n } from '@features/runtime/frontend/shared/i18n.js';
import metadata from './instance-pilot-locale-baseline.json';
import previousMapping from './retired-ui-next-locale-baseline.json';
import { locales, verifyPilotHistoricalCatalog } from './instance-pilot-locale-catalog.js';
import { historicalPilotOwnerValue, restorePilotHistoricalSource, verifyPilotOwnerLanguages } from './instance-pilot-locale-metadata.js';
import { verifyRetiredUiNextLanguages } from './retired-ui-next-locale-baseline.js';
import type { ParameterizedString } from 'i18n';

const root = resolve(import.meta.dirname, '../../../..');
const signature = (value: string) => [...value.matchAll(/\{([^{}]+)\}/g)].map(match => match[1]).sort();
const at = (dictionary: unknown, path: string): unknown => path.split('.').reduce<unknown>((current, key) => current && typeof current === 'object' ? Reflect.get(current, key) : undefined, dictionary);

test('the pilot preserves original good text, explicitly reviewed changes and inactive translations', () => {
	expect(languages).toHaveLength(28);
	expect(metadata.languages).toHaveLength(42);
	let good = 0;
	let changed = 0;
	let inactive = 0;
	let slots = 0;
	for (const owner of metadata.owners) {
		const source = readFileSync(resolve(root, owner.file), 'utf8');
		expect(restorePilotHistoricalSource(owner.file, source)).toBe(owner.originalSource);
		const blocks = parse(source).descriptor.customBlocks.filter(block => block.type === 'locale');
		expect(blocks.map(block => block.attrs.locale)).toEqual(metadata.languages);
		for (const block of blocks) {
			const language = String(block.attrs.locale);
			const actual = JSON.parse(block.content) as Record<string, string>;
			const expected = Reflect.get(owner.reviewed, language) as Record<string, string>;
			expect(actual).toEqual(expected);
			for (const [key, value] of Object.entries(actual)) {
				expect(signature(value)).toEqual(signature(Reflect.get(Reflect.get(owner.reviewed, 'en-US'), key)));
				slots++;
				const original = Reflect.get(owner.original, language) as Record<string, string> | undefined;
				if (!original) continue;
				const edit = owner.changes.find(change => change.language === language && change.path === key);
				if (edit) {
					expect(original[key]).toBe(edit.original);
					expect(value).toBe(edit.reviewed);
					expect(value).not.toBe(edit.original);
					changed++;
				} else {
					expect(value).toBe(original[key]);
					good++;
				}
			}
		}
		for (const [key, dictionary] of Object.entries(owner.inactiveOriginal)) {
			for (const [language, value] of Object.entries(dictionary)) {
				expect(Reflect.get(owner.reviewed, language)[key]).toBe(value);
				inactive++;
			}
		}
	}
	expect({ slots, good, changed, inactive }).toEqual({ slots: 504, good: 266, changed: 70, inactive: 40 });
});

test('five retired catalog keys keep the independently frozen original28 oracle', () => {
	expect(metadata.mappings).toHaveLength(5);
	for (const language of languages) {
		const pairs = metadata.mappings.map((mapping): [string, string] => [String(mapping[0]), String(at(locales[language], String(mapping[0])))]);
		expect(createHash('sha256').update(JSON.stringify(pairs)).digest('hex')).toBe(metadata.sha256[language]);
		for (const [key] of pairs) expect(at(productionLocales[language], key)).toBeUndefined();
	}
	const pairs = metadata.mappings.map((mapping): [string, string] => [String(mapping[0]), String(at(locales['ja-JP'], String(mapping[0])))]);
	expect(() => verifyPilotHistoricalCatalog('ja-JP', pairs)).not.toThrow();
	const changed = pairs.map((pair): [string, string] => [...pair]);
	changed[0][1] += '!';
	expect(() => verifyPilotHistoricalCatalog('ja-JP', changed)).toThrow('Pilot original catalog hash differs');
	expect(() => verifyPilotHistoricalCatalog('ja-JP', pairs.slice(1))).toThrow('Invalid pilot historical key inventory');
});

test('reviewed exceptions and pilot-only locale expansion reject accidental changes', () => {
	const owner = metadata.owners[1];
	const mapped = previousMapping.mappings.find(mapping => mapping[0] === '_aboutMisskey.thisIsModifiedVersion')!;
	expect(previousMapping.owners[Number(mapped[1])]).toBe(owner.file);
	expect(mapped[2]).toBe('aboutMisskeyThisIsModifiedVersion');
	expect(owner.changes.filter(change => change.path === mapped[2])).toHaveLength(14);
	expect(previousMapping.owners[Number(mapped[3])]).toBe('packages/features/web/frontend/pages/about-misskey.vue');
	const edit = owner.changes.find(change => change.path === 'aboutMisskeyThisIsModifiedVersion')!;
	expect(historicalPilotOwnerValue(owner.file, edit.language, edit.path, edit.reviewed)).toBe(edit.original);
	expect(() => historicalPilotOwnerValue(owner.file, edit.language, edit.path, `${edit.reviewed}!`)).toThrow('Pilot owner differs from reviewed text');
	expect(() => historicalPilotOwnerValue(owner.file, 'unknown', edit.path, edit.reviewed)).toThrow('Pilot owner differs from reviewed text');
	expect(verifyPilotOwnerLanguages('unrelated.vue', metadata.languages)).toBe(false);
	expect(() => verifyPilotOwnerLanguages(owner.file, metadata.languages.slice(1))).toThrow('Invalid reviewed pilot languages');
	expect(() => verifyPilotOwnerLanguages(owner.file, [...metadata.languages, 'unknown'])).toThrow('Invalid reviewed pilot languages');
	expect(() => verifyRetiredUiNextLanguages(metadata.languages)).toThrow('Frozen next UI language inventory differs');
	const source = readFileSync(resolve(root, owner.file), 'utf8');
	expect(() => restorePilotHistoricalSource(owner.file, source.replace(edit.reviewed, `${edit.reviewed}!`))).toThrow('Pilot dictionary differs from reviewed text');
	expect(() => restorePilotHistoricalSource(owner.file, source.replace('<template>', '<template>\n<!-- unintended -->'))).toThrow('Pilot changed original component body');
	expect(() => restorePilotHistoricalSource(owner.file, `${source}<!-- appended unintended body -->\n`)).toThrow('Pilot changed original component body');
	expect(() => restorePilotHistoricalSource(owner.file, source.replace('</locale>', '</locale>\n<!-- interleaved unintended body -->'))).toThrow('Pilot changed original component body');
});

test('real VVI switching across all42 languages preserves reviewed text and formatter behavior', async () => {
	const parameters = { x: 'Misskey', name: 'Example', anchor: 'source.example', host: 'example.test' };
	let checked = 0;
	for (const language of [...metadata.languages, 'en-US', 'ja-JP']) {
		const runtime = createInternationalization({ initialLocale: language });
		await runtime.ready;
		await runtime.loadLocale(language);
		runtime.install(createApp({}));
		expect(runtime.locale).toBe(language);
		for (const owner of metadata.owners) {
			const raw = createComponentLocale(owner.file.replace('packages/', '/')) as Record<string, string>;
			const dictionary = Reflect.get(owner.reviewed, language) as Record<string, string>;
			for (const [key, expected] of Object.entries(dictionary)) {
				expect(raw[key]).toBe(expected);
				const legacy = new I18n({ message: expected as ParameterizedString<'x' | 'name' | 'anchor' | 'host'> });
				expect(interpolateLocaleParameters(raw[key], parameters)).toBe(legacy.t('message', parameters));
				checked++;
			}
		}
	}
	expect(checked).toBe(528);
}, 30000);
