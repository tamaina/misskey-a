/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'vue/compiler-sfc';
import { locales } from 'i18n';
import type { RuntimeLocaleDictionary } from 'vite-vue-internationalization/runtime';

// Independently pinned source hashes; translation values remain in locales/*.yml.
export const globalCatalogPilotOwners = [
	{
		"file": "packages/features/collections/frontend/pages/gallery/edit.root.vue",
		"currentSha256": "618c583b4694043f3152b226c024633419d99f236471a1877f0cbd186b18ad34",
		"baselineSha256": "53fe5b78ff387ba19e7de58d01e6c3bab36a237b5c7efc260857547b89ddf845",
		"keys": [
			"save",
			"delete"
		],
		"order": [
			"deleteConfirm",
			"title",
			"description",
			"remove",
			"attachFile",
			"markAsSensitive",
			"save",
			"publish",
			"delete"
		]
	},
	{
		"file": "packages/features/federation/frontend/pages/lookup.vue",
		"currentSha256": "c71dea676bc473147833c8ce042bac2566c95c19afbf0d40ae88ad7d5b6945f9",
		"baselineSha256": "481b50b4cb1e6f31df52a235cd0472500427b192be62cd2db2205ccc9ef775b0",
		"keys": [
			"close"
		],
		"order": [
			"close",
			"goToMisskey",
			"fetchingAsApObject",
			"lookup"
		]
	},
	{
		"file": "packages/features/ui/frontend/components/MkWindow.vue",
		"currentSha256": "736c644594a8205d3bf361e7c4764b43294c15f751887f55606dd24eb5a6403c",
		"baselineSha256": "8751a56c744171748ecf6e98432db7383e20ed5d500de7401aa406a2c67ef172",
		"keys": [
			"close"
		],
		"order": [
			"windowRestore",
			"windowMinimize",
			"windowMaximize",
			"close"
		]
	}
] as const;
const root = resolve(import.meta.dirname, '../../../..');
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

/** Replay the pre-pilot source only after verifying both complete source boundaries. */
export function restoreGlobalCatalogPilotSource(file: string, source: string): string {
	const owner = globalCatalogPilotOwners.find(owner => owner.file === file);
	if (!owner || sha256(source) === owner.baselineSha256) return source;
	if (sha256(source) !== owner.currentSha256) throw new Error(`Global catalog pilot source differs: ${file}`);
	source = source
		.replace("import { useLocale } from 'virtual:vite-vue-internationalization';\n", '')
		.replace("import type { GlobalLocale } from '@features/runtime/frontend/shared/global-locale.js';\n", '')
		.replace('const globalLocale = useLocale<GlobalLocale>(import.meta.url);\n\n', '');
	for (const key of owner.keys) source = source.replaceAll(`globalLocale.env.${key}`, `$locale.sfc.${key}`);
	source = source.replace(/(<locale[^>]*locale="([^"]+)"[^>]*>)([\s\S]*?)<\/locale>/g, (_block, start: string, language: string, content: string) => {
		const current = JSON.parse(content) as Record<string, string>;
		const messages = locales[language];
		if (!messages) throw new Error(`Unexpected global catalog pilot language: ${language}`);
		const original = Object.fromEntries(owner.order.map(key => [key, Object.hasOwn(current, key) ? current[key] : messages[key as keyof typeof messages]]));
		const indent = content.match(/\n([ \t]+)"/)?.[1];
		if (!indent) throw new Error(`Missing global catalog pilot dictionary indent: ${file}`);
		return `${start}\n${JSON.stringify(original, null, indent)}\n</locale>`;
	});
	if (sha256(source) !== owner.baselineSha256) throw new Error(`Global catalog pilot baseline differs: ${file}`);
	return source;
}

/** Verify live owner and global scopes before replaying the existing raw-owner oracle. */
export function restoreGlobalCatalogPilotDictionary(file: string, language: string, dictionary: RuntimeLocaleDictionary, global: RuntimeLocaleDictionary): RuntimeLocaleDictionary {
	const owner = globalCatalogPilotOwners.find(owner => owner.file === file);
	if (!owner) return dictionary;
	const source = readFileSync(resolve(root, file), 'utf8');
	const baseline = restoreGlobalCatalogPilotSource(file, source);
	const collect = (text: string): Record<string, string> => {
		const block = parse(text).descriptor.customBlocks.find(block => block.type === 'locale' && block.attrs.locale === language);
		if (!block) throw new Error(`Missing global catalog pilot language: ${file}:${language}`);
		return JSON.parse(block.content) as Record<string, string>;
	};
	if (JSON.stringify(Object.fromEntries(Object.entries(dictionary))) !== JSON.stringify(collect(source))) throw new Error(`Global catalog pilot loader differs: ${file}:${language}`);
	for (const key of owner.keys) {
		if (typeof global[key] !== 'string' || global[key] !== locales[language]?.[key]) throw new Error(`Global catalog pilot shared label differs: ${language}:${key}`);
	}
	const restored = Object.fromEntries(owner.order.map(key => [key, Object.hasOwn(dictionary, key) ? dictionary[key] : global[key]]));
	if (JSON.stringify(restored) !== JSON.stringify(collect(baseline))) throw new Error(`Global catalog pilot historical dictionary differs: ${file}:${language}`);
	return restored;
}
