/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'vue/compiler-sfc';
import { expect, test } from 'vitest';
import { createInternationalization, setActiveInternationalization, createComponentLocale } from 'vite-vue-internationalization/runtime';
import { languages } from 'i18n';
import rebases from './pwa-share-source-rebase.json';
import { restorePwaShareSourceBaseline } from './pwa-share-source-rebase.js';

const root = resolve(import.meta.dirname, '../../../..');
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

test.each(rebases)('$file restores exact reviewed develop bytes and rejects unreviewed body or locale changes', proof => {
	const source = readFileSync(resolve(root, proof.file), 'utf8');
	const restored = restorePwaShareSourceBaseline(proof.file, source);
	const localeStart = restored.search(/<locale\s/);
	expect(sha256(localeStart < 0 ? restored : restored.slice(0, localeStart))).toBe(proof.baselineBodySha256);
	expect(sha256(localeStart < 0 ? '' : restored.slice(localeStart))).toBe(proof.baselineLocaleBlocksSha256);
	expect(() => restorePwaShareSourceBaseline(proof.file, '// unreviewed\n' + source)).toThrow('Source differs');
	if (localeStart >= 0) expect(() => restorePwaShareSourceBaseline(proof.file, source + '\n')).toThrow('Source differs');
});

test('PWA share menu and storage-error messages retain exact Japanese text and fallback in every language', async () => {
	const file = 'packages/features/share/frontend/pages/share.vue';
	const source = readFileSync(resolve(root, file), 'utf8');
	const { descriptor, errors } = parse(source, { filename: file });
	expect(errors).toEqual([]);
	const blocks = descriptor.customBlocks.filter(block => block.type === 'locale');
	expect(blocks.map(block => block.attrs.locale)).toEqual(languages);
	const dictionaries = new Map<string, Record<string, string>>(blocks.map(block => [String(block.attrs.locale), JSON.parse(block.content)]));
	const expected = { menu: 'メニュー', error: 'エラー' };
	for (const [language, dictionary] of dictionaries) {
		if (language === 'ja-JP') {
			expect(dictionary.menu).toBe(expected.menu);
			expect(dictionary.error).toBe(expected.error);
		} else {
			expect(Object.hasOwn(dictionary, 'menu')).toBe(false);
			expect(Object.hasOwn(dictionary, 'error')).toBe(false);
		}
	}
	const module = '/features/share/frontend/pages/share.vue';
	for (const language of languages) {
		const runtime = createInternationalization({
			primaryLocale: 'ja-JP', initialLocale: language,
			loaders: Object.fromEntries(languages.map(locale => [locale, async () => ({ modules: { [module]: dictionaries.get(locale)! } })])),
		});
		await runtime.ready;
		await runtime.loadLocale('ja-JP');
		await runtime.loadLocale(language);
		setActiveInternationalization(runtime);
		const messages = createComponentLocale(module);
		expect(messages.menu).toBe(expected.menu);
		expect(messages.error).toBe(expected.error);
	}
	expect(source).toContain('text: $locale.value.sfc.menu');
	expect(source).toContain('title: $locale.value.sfc.error');
});
