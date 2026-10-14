/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { parse, compileTemplate } from 'vue/compiler-sfc';
import { expect, test } from 'vitest';
import { createInternationalization, setActiveInternationalization, createComponentLocale } from 'vite-vue-internationalization/runtime';
import { languages } from 'i18n';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { pluginVvi } from '../../lib/vite-plugin-vvi.js';
import { restoreBillingCatalogBaseline } from './billing-catalog-source-rebase.js';
import { restoreCodeDiffBaseline } from './code-diff-source-rebase.js';
import rebase from './billing-catalog-source-rebase.json';
import codeDiffRebases from './code-diff-source-rebase.json';
import type { LocaleBundle } from 'vite-vue-internationalization/runtime';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

function hook(value: unknown, ...args: unknown[]): unknown {
	if (typeof value === 'function') return Reflect.apply(value, {}, args);
	if (value && typeof value === 'object' && 'handler' in value && typeof value.handler === 'function') return Reflect.apply(value.handler, {}, args);
	throw new Error('Expected Vite hook');
}

test('billing addition restores the unchanged source oracle and rejects unknown edits', () => {
	const source = readFileSync(resolve(root, rebase.file), 'utf8'), restored = restoreBillingCatalogBaseline(rebase.file, source);
	expect(createHash('sha256').update(restored).digest('hex')).toBe(rebase.baselineSha256);
	const original = restoreCodeDiffBaseline(rebase.file, restored), pinned = codeDiffRebases.find(entry => entry.file === rebase.file)!;
	expect(createHash('sha256').update(original).digest('hex')).toBe(pinned.baselineSha256);
	expect(restoreBillingCatalogBaseline(rebase.file, restored)).toBe(restored);
	expect(() => restoreBillingCatalogBaseline(rebase.file, source + '\n')).toThrow('Source differs');
	expect(() => restoreBillingCatalogBaseline(rebase.file, source.replace(rebase.edits[0].current, 'tampered'))).toThrow('Source differs');
	const parsed = parse(source); expect(parsed.errors).toEqual([]);
	expect(parsed.descriptor.template!.content).toContain('log.type === \'billingCatalog\' ? $locale.sfc.billingCatalogLabel');
	expect(compileTemplate({ source: parsed.descriptor.template!.content, filename: rebase.file, id: 'billing-audit' }).errors).toEqual([]);
});
test('actual VVI loaders provide independent billing label fallback without changing legacy type dictionaries', async () => {
	const plugin = pluginVvi(); hook(plugin.configResolved, { root: resolve(root, 'packages/frontend'), command: 'build', base: '/', build: { ssr: false } }); hook(plugin.buildStart);
	for (const language of languages) {
		const source = hook(plugin.load, `\0virtual:vite-vue-internationalization/locale/${language}`); if (typeof source !== 'string') throw new Error('Expected loader');
		const payload: LocaleBundle = {};
		runInNewContext(source.replaceAll('export const ', 'const ').replace('export default { locale, global, modules };', 'payload.global = global; payload.modules = modules;'), { payload });
		const runtime = createInternationalization({ primaryLocale: 'ja-JP', initialLocale: language, loaders: { [language]: async () => payload } }); await runtime.ready; await runtime.loadLocale(language); setActiveInternationalization(runtime);
		const locale = createComponentLocale(rebase.file.replace('packages/', '/'));
		expect(locale.billingCatalogLabel).toBe('課金カタログの変更');
		expect(Reflect.get(copyLocaleDictionary(locale.moderationLogTypesLabels as object), 'billingCatalog')).toBeUndefined();
	}
}, 30000);
