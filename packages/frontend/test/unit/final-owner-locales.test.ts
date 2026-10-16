/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { resolve } from 'node:path';
import { createApp } from 'vue';
import { compileScript, parse } from 'vue/compiler-sfc';
import { expect, test } from 'vitest';
import { languages, locales } from 'i18n';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { createComponentLocale } from 'vite-vue-internationalization/runtime';
import { I18n } from '@features/runtime/frontend/shared/i18n.js';
import { pluginVvi } from '../../lib/vite-plugin-vvi.js';
import metadata from './final-owner-locale-baseline.json';
import retired from './retired-ui-next-locale-baseline.json';
import { historicalFinalOwnerValue, originalFinalOwnerDictionaries, reviewedFinalOwnerDictionaries, restoreFinalOwnerHistoricalSource } from './final-owner-locale-baseline.js';

const root = resolve(import.meta.dirname, '../../../..');
const sourceHash = (value: string) => createHash('sha256').update(value).digest('hex');

function catalogPairs(dictionary: unknown): [string, string][] {
	return metadata.catalogs.globals.flatMap(global => {
		const value = global.split('.').reduce<unknown>((current, key) => current && typeof current === 'object' ? Reflect.get(current, key) : undefined, dictionary);
		return typeof value === 'string' ? [[global, value] as [string, string]] : [];
	});
}

test('four owners retain 754 prior values and apply only 226 independently reviewed translations', () => {
	expect(metadata.languages).toEqual(languages);
	expect(metadata.owners).toHaveLength(4);
	let changed = 0;
	let preserved = 0;
	for (const owner of metadata.owners) {
		expect(sourceHash(owner.originalSource)).toBe(owner.sourceSha256);
		const source = readFileSync(resolve(root, owner.file), 'utf8');
		expect(restoreFinalOwnerHistoricalSource(owner.file, source)).toBe(owner.originalSource);
		expect(new Set(owner.changes.map(change => `${change.language}:${change.path}`)).size).toBe(owner.changes.length);
		const original = originalFinalOwnerDictionaries.get(owner.file)!;
		const reviewed = reviewedFinalOwnerDictionaries.get(owner.file)!;
		const blocks = parse(source).descriptor.customBlocks.filter(block => block.type === 'locale');
		expect(blocks.map(block => block.attrs.locale)).toEqual(languages);
		for (const block of blocks) {
			const language = String(block.attrs.locale);
			const actual = JSON.parse(block.content) as Record<string, string>;
			expect(actual).toEqual(reviewed[language]);
			for (const [key, value] of Object.entries(actual)) {
				expect(value).not.toMatch(/\{[^{}]+\}/);
				const change = owner.changes.find(change => change.language === language && change.path === key);
				if (change) {
					expect(original[language][key]).toBe(change.original);
					expect(value).toBe(change.reviewed);
					expect(value).not.toBe(change.original);
					expect(change.original).toBe(original['en-US'][key]);
					if (change.original.includes('QR')) expect(value).toContain('QR');
					changed++;
				} else {
					expect(value).toBe(original[language][key]);
					preserved++;
				}
			}
		}
	}
	expect({ changed, preserved }).toEqual({ changed: 226, preserved: 754 });
});

test('165 exact mapped translations preserve the frozen 789-key historical oracle', () => {
	const changedByOwner = new Map<string, number>();
	let mappings = 0;
	for (const mapping of retired.mappings) {
		for (let index = 1; index < mapping.length; index += 2) {
			const file = retired.owners[Number(mapping[index])];
			const path = String(mapping[index + 1]);
			const owner = metadata.owners.find(owner => owner.file === file);
			if (!owner) continue;
			mappings++;
			const selected = owner.changes.filter(change => change.path === path);
			changedByOwner.set(file, (changedByOwner.get(file) ?? 0) + selected.length);
			for (const language of languages) {
				const original = originalFinalOwnerDictionaries.get(file)![language][path];
				const reviewed = reviewedFinalOwnerDictionaries.get(file)![language][path];
				expect(historicalFinalOwnerValue(file, language, path, reviewed)).toBe(original);
			}
		}
	}
	expect(mappings).toBe(12);
	expect(Object.fromEntries(metadata.owners.map(owner => [owner.file, changedByOwner.get(owner.file)]))).toEqual({
		'packages/features/auth/frontend/components/MkSignin.vue': 21,
		'packages/features/auth/frontend/pages/settings/security.vue': 14,
		'packages/features/share/frontend/pages/qr.read.vue': 119,
		'packages/features/instance/frontend/pages/admin/server-rules.vue': 11,
	});
	expect([...changedByOwner.values()].reduce((sum, count) => sum + count, 0)).toBe(165);
});

test('only the 23 relevant global-key mappings retain their raw and effective catalog values', () => {
	expect(metadata.catalogs.globals).toHaveLength(23);
	for (const [language, frozen] of Object.entries(metadata.catalogs.raw)) {
		const raw = load(readFileSync(resolve(root, 'locales', `${language}.yml`), 'utf8').replaceAll('\b', '')) ?? {};
		const dictionary = catalogPairs(raw);
		expect(dictionary).toHaveLength(frozen.count);
		expect(sourceHash(JSON.stringify(dictionary))).toBe(frozen.sha256);
	}
	for (const language of languages) {
		const frozen = metadata.catalogs.effective[language];
		const dictionary = catalogPairs(locales[language]);
		expect(dictionary).toHaveLength(frozen.count);
		expect(sourceHash(JSON.stringify(dictionary))).toBe(frozen.sha256);
	}
});

test.each(metadata.owners)('$file rejects unapproved text, inventories and every nonlocale source edit', owner => {
	const source = readFileSync(resolve(root, owner.file), 'utf8');
	const edit = owner.changes[0];
	const literal = JSON.stringify(edit.reviewed);
	expect(source).toContain(literal);
	expect(() => restoreFinalOwnerHistoricalSource(owner.file, source.replace(literal, JSON.stringify(`${edit.reviewed}!`)))).toThrow('Final-owner dictionary differs from reviewed text');
	const good = originalFinalOwnerDictionaries.get(owner.file)!['en-US'][owner.mappings[0][1]];
	expect(() => restoreFinalOwnerHistoricalSource(owner.file, source.replace(JSON.stringify(good), JSON.stringify(`${good}!`)))).toThrow('Final-owner dictionary differs from reviewed text');
	expect(() => historicalFinalOwnerValue(owner.file, edit.language, edit.path, `${edit.reviewed}!`)).toThrow('Final owner differs from reviewed text');
	expect(() => historicalFinalOwnerValue(owner.file, 'unknown', edit.path, edit.reviewed)).toThrow('Final owner differs from reviewed text');
	expect(() => historicalFinalOwnerValue(owner.file, edit.language, 'unknown', edit.reviewed)).toThrow('Final owner differs from reviewed text');
	expect(() => restoreFinalOwnerHistoricalSource(owner.file, source.replace(JSON.stringify(owner.mappings[0][1]) + ':', '"unexpected":'))).toThrow('Invalid final-owner key inventory');
	expect(() => restoreFinalOwnerHistoricalSource(owner.file, source.replace('locale="ar-SA"', 'locale="unknown"'))).toThrow('Invalid final-owner language inventory');
	expect(() => restoreFinalOwnerHistoricalSource(owner.file, `${source}<locale locale="unknown" lang="json">{}</locale>\n`)).toThrow('Invalid final-owner language inventory');
	const blocks = parse(source).descriptor.customBlocks.filter(block => block.type === 'locale');
	const firstStart = source.lastIndexOf('<locale', blocks[0].loc.start.offset);
	const firstEnd = source.indexOf('</locale>', blocks[0].loc.end.offset) + '</locale>'.length;
	const secondStart = source.lastIndexOf('<locale', blocks[1].loc.start.offset);
	const secondEnd = source.indexOf('</locale>', blocks[1].loc.end.offset) + '</locale>'.length;
	expect(() => restoreFinalOwnerHistoricalSource(owner.file, source.slice(0, firstStart) + source.slice(firstEnd))).toThrow('Invalid final-owner language inventory');
	const reordered = source.slice(0, firstStart) + source.slice(secondStart, secondEnd) + source.slice(firstEnd, secondStart) + source.slice(firstStart, firstEnd) + source.slice(secondEnd);
	expect(() => restoreFinalOwnerHistoricalSource(owner.file, reordered)).toThrow('Invalid final-owner language inventory');
	expect(() => restoreFinalOwnerHistoricalSource(owner.file, source.replace('<template>', '<template>\n<!-- unintended body -->'))).toThrow('Final owner changed original component body');
	expect(() => restoreFinalOwnerHistoricalSource(owner.file, `${source}<!-- appended body -->\n`)).toThrow('Final owner changed original component body');
	expect(() => restoreFinalOwnerHistoricalSource(owner.file, source.replace('</locale>', '</locale>\n<!-- interleaved body -->'))).toThrow('Final owner changed original component body');
	expect(restoreFinalOwnerHistoricalSource('unrelated.vue', source)).toBe(source);
});

test('installed VVI and Vue compile all four real owner components', async () => {
	const plugin = pluginVvi();
	const hook = (value: unknown, ...args: unknown[]): unknown => {
		if (typeof value === 'function') return Reflect.apply(value, {}, args);
		if (value && typeof value === 'object' && 'handler' in value && typeof value.handler === 'function') return Reflect.apply(value.handler, {}, args);
		throw new Error('Expected VVI plugin hook');
	};
	hook(plugin.configResolved, { root: resolve(root, 'packages/frontend'), command: 'build', base: '/', build: { ssr: false } });
	hook(plugin.buildStart);
	for (const owner of metadata.owners) {
		const filename = resolve(root, owner.file);
		const transformed = await hook(plugin.transform, readFileSync(filename, 'utf8'), filename) as { code: string };
		expect(transformed.code).toContain('createComponentLocale');
		const parsed = parse(transformed.code, { filename });
		expect(parsed.errors).toEqual([]);
		expect(compileScript(parsed.descriptor, { id: owner.file, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') } }).content).toContain('useLocale');
	}
}, 30000);

test('actual VVI resolves all 980 reviewed labels and returns to English and Japanese', async () => {
	let checked = 0;
	for (const language of [...metadata.languages, 'en-US', 'ja-JP']) {
		const runtime = createInternationalization({ initialLocale: language });
		await runtime.ready;
		await runtime.loadLocale(language);
		runtime.install(createApp({}));
		expect(runtime.locale).toBe(language);
		for (const owner of metadata.owners) {
			const actual = createComponentLocale(owner.file.replace('packages/', '/')) as Record<string, string>;
			const expected = reviewedFinalOwnerDictionaries.get(owner.file)![language];
			for (const [key, message] of Object.entries(expected)) {
				expect(actual[key]).toBe(message);
				expect(Buffer.from(actual[key])).toEqual(Buffer.from(message));
				expect(actual[key]).toBe(new I18n({ message }).t('message'));
				checked++;
			}
		}
	}
	expect(checked).toBe(1050);
}, 30000);
