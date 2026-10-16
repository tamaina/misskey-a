/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { parse, compileScript, compileTemplate } from 'vue/compiler-sfc';
import { expect, test } from 'vitest';
import { languages, locales } from 'i18n';
import { createInternationalization, setActiveInternationalization, useLocale } from 'vite-vue-internationalization/runtime';
import type { LocaleBundle } from 'vite-vue-internationalization/runtime';
import { pluginVvi } from '../../lib/vite-plugin-vvi.js';
import { globalCatalogPilotOwners, restoreGlobalCatalogPilotSource, restoreGlobalCatalogPilotDictionary } from './global-catalog-pilot-baseline.js';
import embedMessages from '../../../features/boot/frontend/embed/boot-messages.json';

const root = resolve(import.meta.dirname, '../../../..');
const owners = [
	['packages/features/collections/frontend/pages/gallery/edit.root.vue', ['save', 'delete']],
	['packages/features/federation/frontend/pages/lookup.vue', ['close']],
	['packages/features/ui/frontend/components/MkWindow.vue', ['close']],
] as const;

function hook(value: unknown, ...args: unknown[]): unknown {
	if (typeof value === 'function') return Reflect.apply(value, {}, args);
	if (value && typeof value === 'object' && 'handler' in value && typeof value.handler === 'function') return Reflect.apply(value.handler, {}, args);
	throw new Error('Expected VVI hook');
}

function configured(embed = false) {
	const plugin = pluginVvi({ embed });
	hook(plugin.configResolved, { root: resolve(root, embed ? 'packages/frontend-embed' : 'packages/frontend'), command: 'build', base: '/', build: { ssr: false } });
	hook(plugin.buildStart);
	return plugin;
}

function payload(plugin: ReturnType<typeof pluginVvi>, language: string): LocaleBundle {
	const source = hook(plugin.load, `\0virtual:vite-vue-internationalization/locale/${language}`);
	if (typeof source !== 'string') throw new Error('Expected generated locale module');
	const result: LocaleBundle = {};
	runInNewContext(source.replaceAll('export const ', 'const ').replace('export default { locale, global, modules };', 'result.global = global; result.modules = modules;'), { result });
	return result;
}

const plugin = configured();

test('all 112 original pilot labels retain their bytes through the shared runtime, including English fallback', async () => {
	const pairs: string[][] = [];
	for (const [file, keys] of owners) {
		for (const language of languages) {
			const bundle = payload(plugin, language);
			expect(bundle.global).toEqual({ save: locales[language].save, delete: locales[language].delete, close: locales[language].close });
			const runtime = createInternationalization({ primaryLocale: 'ja-JP', initialLocale: language, loaders: { [language]: async () => bundle } });
			await runtime.ready;
			setActiveInternationalization(runtime);
			const { env, sfc } = useLocale(file.replace('packages/', '/')).value;
			for (const key of keys) {
				expect(sfc).not.toHaveProperty(key);
				pairs.push([file, language, key, String(env[key])]);
			}
		}
	}
	// Frozen before extraction from the three owners, not regenerated from the catalog.
	expect(pairs).toHaveLength(112);
	expect(createHash('sha256').update(JSON.stringify(pairs)).digest('hex')).toBe('079703799eb81e6fb79dc7e6d6e5ea07b602176a02a76eabb22b9812db914016');
});

test.each(owners)('%s compiles shared labels and keeps its screen-specific dictionary', async (file, keys) => {
	const filename = resolve(root, file);
	const source = readFileSync(filename, 'utf8');
	for (const key of keys) {
		expect(source).toContain(`globalLocale.env.${key}`);
		expect(source).not.toContain(`$locale.sfc.${key}`);
	}
	const transformed = await hook(plugin.transform, source, filename) as { code: string };
	const parsed = parse(transformed.code, { filename });
	expect(parsed.errors).toEqual([]);
	const script = compileScript(parsed.descriptor, { id: file });
	expect(script.content).toContain('useLocale');
	const template = compileTemplate({ source: parsed.descriptor.template!.content, filename, id: file, compilerOptions: { bindingMetadata: script.bindings } });
	expect(template.errors).toEqual([]);
	for (const key of keys) expect(template.code).toContain(`.env.${key}`);
});

test('embed retains only its existing boot globals and its language inventory', () => {
	const embed = configured(true);
	for (const language of languages) {
		expect(payload(embed, language).global).toEqual(embedMessages[language]);
		expect(payload(embed, language).global).not.toHaveProperty('save');
	}
});

test.each(globalCatalogPilotOwners)('$file rejects source, owner and global changes before replaying historical proofs', owner => {
	const source = readFileSync(resolve(root, owner.file), 'utf8');
	const baseline = restoreGlobalCatalogPilotSource(owner.file, source);
	expect(createHash('sha256').update(source).digest('hex')).toBe(owner.currentSha256);
	expect(createHash('sha256').update(baseline).digest('hex')).toBe(owner.baselineSha256);
	expect(restoreGlobalCatalogPilotSource(owner.file, baseline)).toBe(baseline);
	expect(() => restoreGlobalCatalogPilotSource(owner.file, source + '\n')).toThrow('Global catalog pilot source differs');
	expect(() => restoreGlobalCatalogPilotSource(owner.file, source.replace(`globalLocale.env.${owner.keys[0]}`, 'globalLocale.env.unreviewed'))).toThrow('Global catalog pilot source differs');
	const bundle = payload(plugin, 'ja-JP');
	const dictionary = bundle.modules![owner.file.replace('packages/', '/')]!;
	const restored = restoreGlobalCatalogPilotDictionary(owner.file, 'ja-JP', dictionary, bundle.global!);
	for (const key of owner.keys) expect(restored[key]).toBe(locales['ja-JP'][key]);
	expect(() => restoreGlobalCatalogPilotDictionary(owner.file, 'ja-JP', { ...dictionary, extra: 'unreviewed' }, bundle.global!)).toThrow('Global catalog pilot loader differs');
	expect(() => restoreGlobalCatalogPilotDictionary(owner.file, 'ja-JP', dictionary, { ...bundle.global, [owner.keys[0]]: 'unreviewed' })).toThrow('Global catalog pilot shared label differs');
});
