/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { load } from 'js-yaml';
import { createApp } from 'vue';
import { parse } from 'vue/compiler-sfc';
import { expect, test } from 'vitest';
import { languages, locales } from 'i18n';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { createComponentLocale } from 'vite-vue-internationalization/runtime';
import { I18n } from '@features/runtime/frontend/shared/i18n.js';
import metadata from './email-settings-locale-baseline.json';
import { originalEmailDictionaries, restoreEmailHistoricalSource } from './email-settings-locale-baseline.js';

const root = resolve(import.meta.dirname, '../../../..');
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const at = (dictionary: unknown, path: string): unknown => path.split('.').reduce<unknown>((current, key) => current && typeof current === 'object' ? Reflect.get(current, key) : undefined, dictionary);

function rawLocale(language: string): unknown {
	return load(readFileSync(resolve(root, 'locales', `${language}.yml`), 'utf8').replaceAll('\b', '')) ?? {};
}

test('email translations change only 65 independently reviewed fallback slots and preserve 355 prior values', () => {
	expect(createHash('sha256').update(metadata.originalSource).digest('hex')).toBe(metadata.sourceSha256);
	expect(metadata.languages).toEqual(languages);
	expect(metadata.mappings).toHaveLength(15);
	expect(metadata.changes).toHaveLength(65);
	expect(new Set(metadata.changes.map(change => `${change.language}:${change.path}`)).size).toBe(65);
	const source = readFileSync(resolve(root, metadata.file), 'utf8');
	expect(restoreEmailHistoricalSource(metadata.file, source)).toBe(metadata.originalSource);
	let changed = 0;
	let preserved = 0;
	for (const block of parse(source).descriptor.customBlocks.filter(block => block.type === 'locale')) {
		const language = String(block.attrs.locale);
		const dictionary = JSON.parse(block.content) as Record<string, string>;
		const expected = Reflect.get(metadata.reviewed, language) as Record<string, string>;
		expect(dictionary).toEqual(expected);
		const raw = rawLocale(language);
		for (const [key, value] of Object.entries(dictionary)) {
			expect(value).not.toMatch(/\{[^{}]+\}/);
			const change = metadata.changes.find(change => change.language === language && change.path === key);
			if (change) {
				expect(originalEmailDictionaries[language][key]).toBe(change.original);
				expect(value).toBe(change.reviewed);
				expect(value).not.toBe(change.original);
				expect(change.original).toBe(originalEmailDictionaries['en-US'][key]);
				if (['smtpConfig', 'emptyToDisableSmtpAuth', 'smtpSecure'].includes(key)) expect(value).toContain('SMTP');
				if (key === 'smtpSecure') expect(value).toContain('SSL/TLS');
				if (key === 'smtpSecureInfo') expect(value).toContain('STARTTLS');
				const mapping = metadata.mappings.find(mapping => mapping[1] === key)!;
				expect(at(raw, mapping[0])).toBeUndefined();
				changed++;
			} else {
				expect(value).toBe(originalEmailDictionaries[language][key]);
				preserved++;
			}
		}
	}
	expect({ changed, preserved }).toEqual({ changed: 65, preserved: 355 });
	expect(metadata.preservedEnglishEqualRawSlots).toHaveLength(18);
	expect(metadata.preservedAbsentRawLoanwords).toHaveLength(2);
	for (const slot of [...metadata.preservedEnglishEqualRawSlots, ...metadata.preservedAbsentRawLoanwords]) {
		expect(Reflect.get(metadata.reviewed, slot.language)[slot.local]).toBe(slot.value);
		expect(originalEmailDictionaries[slot.language][slot.local]).toBe(slot.value);
	}
});

test('all 15 global messages and 426 existing raw translations remain unchanged', () => {
	expect(readdirSync(resolve(root, 'locales')).filter(file => file.endsWith('.yml')).map(file => file.slice(0, -4)).sort()).toEqual(Object.keys(metadata.raw).sort());
	let supported = 0;
	let inactive = 0;
	for (const [language, frozen] of Object.entries(metadata.raw)) {
		const dictionary = rawLocale(language);
		const pairs = metadata.mappings.map(mapping => [mapping[0], at(dictionary, mapping[0])]).filter(([, value]) => typeof value === 'string');
		expect(pairs).toHaveLength(frozen.count);
		expect(digest(pairs)).toBe(frozen.sha256);
		if ((languages as readonly string[]).includes(language)) supported += pairs.length;
		else inactive += pairs.length;
	}
	expect({ supported, inactive }).toEqual({ supported: 353, inactive: 73 });
	for (const language of languages) {
		const pairs = metadata.mappings.map(mapping => [mapping[0], at(locales[language], mapping[0])]);
		expect(digest(pairs)).toBe(metadata.effective[language]);
	}
});

test('email historical projection rejects unapproved values, inventories and nonlocale body edits', () => {
	const source = readFileSync(resolve(root, metadata.file), 'utf8');
	const changed = metadata.changes[0];
	const literal = JSON.stringify(changed.reviewed);
	expect(source).toContain(literal);
	expect(() => restoreEmailHistoricalSource(metadata.file, source.replace(literal, JSON.stringify(`${changed.reviewed}!`)))).toThrow('Email dictionary differs from reviewed text');
	const originalGood = originalEmailDictionaries['ar-SA'].emailServer;
	expect(() => restoreEmailHistoricalSource(metadata.file, source.replace(JSON.stringify(originalGood), JSON.stringify(`${originalGood}!`)))).toThrow('Email dictionary differs from reviewed text');
	expect(() => restoreEmailHistoricalSource(metadata.file, source.replace('"smtpUser":', '"unexpected":'))).toThrow('Invalid email key inventory');
	expect(() => restoreEmailHistoricalSource(metadata.file, source.replace('locale="ar-SA"', 'locale="unknown"'))).toThrow('Invalid reviewed email language inventory');
	expect(() => restoreEmailHistoricalSource(metadata.file, `${source}<locale locale="unknown" lang="json">{}</locale>\n`)).toThrow('Invalid reviewed email language inventory');
	const blocks = parse(source).descriptor.customBlocks.filter(block => block.type === 'locale');
	const firstStart = source.lastIndexOf('<locale', blocks[0].loc.start.offset);
	const firstEnd = source.indexOf('</locale>', blocks[0].loc.end.offset) + '</locale>'.length;
	const secondStart = source.lastIndexOf('<locale', blocks[1].loc.start.offset);
	const secondEnd = source.indexOf('</locale>', blocks[1].loc.end.offset) + '</locale>'.length;
	expect(() => restoreEmailHistoricalSource(metadata.file, source.slice(0, firstStart) + source.slice(firstEnd))).toThrow('Invalid reviewed email language inventory');
	const reordered = source.slice(0, firstStart) + source.slice(secondStart, secondEnd) + source.slice(firstEnd, secondStart) + source.slice(firstStart, firstEnd) + source.slice(secondEnd);
	expect(() => restoreEmailHistoricalSource(metadata.file, reordered)).toThrow('Invalid reviewed email language inventory');
	expect(() => restoreEmailHistoricalSource(metadata.file, source.replace('<template>', '<template>\n<!-- unintended body -->'))).toThrow('Email settings changed original component body');
	expect(() => restoreEmailHistoricalSource(metadata.file, `${source}<!-- appended body -->\n`)).toThrow('Email settings changed original component body');
	expect(() => restoreEmailHistoricalSource(metadata.file, source.replace('</locale>', '</locale>\n<!-- interleaved body -->'))).toThrow('Email settings changed original component body');
	expect(restoreEmailHistoricalSource('unrelated.vue', source)).toBe(source);
});

test('actual VVI resolves all 28 reviewed email dictionaries and returns to English and Japanese', async () => {
	let checked = 0;
	for (const language of [...metadata.languages, 'en-US', 'ja-JP']) {
		const runtime = createInternationalization({ initialLocale: language });
		await runtime.ready;
		await runtime.loadLocale(language);
		runtime.install(createApp({}));
		expect(runtime.locale).toBe(language);
		const actual = createComponentLocale(metadata.file.replace('packages/', '/')) as Record<string, string>;
		const expected = Reflect.get(metadata.reviewed, language) as Record<string, string>;
		for (const [key, message] of Object.entries(expected)) {
			expect(actual[key]).toBe(message);
			expect(Buffer.from(actual[key])).toEqual(Buffer.from(message));
			expect(actual[key]).toBe(new I18n({ message }).t('message'));
			checked++;
		}
	}
	expect(checked).toBe(450);
}, 30000);
